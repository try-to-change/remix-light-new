import { first } from "rxjs";
import * as vscode from "vscode";
import * as https from "https";
import * as vm from "vm";
import * as nodePath from "path";
import type ContractFileWatcher from "./ContractFileWatcher";
import type { Resources, ResourceSetObservable } from "./Resources";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const solcWrapper = require("solc/wrapper");

const SOLC_BIN_LIST_URL = "https://binaries.soliditylang.org/bin/list.json";
const SOLC_BIN_BASE_URL = "https://binaries.soliditylang.org/bin/";

export interface SolcRelease {
  version: string;
  longVersion: string;
  path: string;
}

export interface CompiledContract {
  id: string;
  name: string;
  abi: {
    name: string;
    inputs: { type: string; name: string }[];
    outputs: { type: string }[];
    stateMutability: string;
    type: string;
  }[];
  bytecode: string;
}

/** Fetch plain text via Node https (works inside the VS Code extension host). */
function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error("HTTP " + res.statusCode + " fetching " + url));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

/** Fetch the official solc build list from soliditylang.org (newest-first). */
export async function fetchSolcVersionList(): Promise<SolcRelease[]> {
  const text = await fetchText(SOLC_BIN_LIST_URL);
  const json = JSON.parse(text) as {
    builds: { version: string; longVersion: string; path: string }[];
  };
  return [...json.builds].reverse().map((b) => ({
    version: b.version,
    longVersion: b.longVersion,
    path: b.path,
  }));
}

/** Download a specific solc binary and return an initialised solc instance. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSolcVersion(release: SolcRelease): Promise<any> {
  const src = await fetchText(SOLC_BIN_BASE_URL + release.path);
  const mod: { exports: Record<string, unknown> } = { exports: {} };
  const script = new vm.Script(src, { filename: release.path });
  const solcDir = nodePath.dirname(require.resolve("solc"));
  const ctx = vm.createContext({
    module: mod,
    exports: mod.exports,
    require: require,
    __dirname: solcDir,
    __filename: nodePath.join(solcDir, release.path),
    print: () => {},
    printErr: () => {},
    process: process,
    Buffer: Buffer,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
  });
  script.runInContext(ctx);
  return solcWrapper(mod.exports);
}

export default class Compiler {
  public api;
  public files: vscode.Uri[] = [];
  public openedContract: vscode.Uri | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private solcInstance: any = null;
  private loadedVersion: string = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bundledSolc: any = null;
  private availableVersions: SolcRelease[] = [];

  constructor(
    private resources: Resources,
    public cfw: ContractFileWatcher,
    private out: vscode.OutputChannel,
  ) {
    // Lazily load bundled solc inside constructor to avoid crashing the
    // extension host at module-load time (wasmBinary init issue).
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.bundledSolc = require("solc");
      this.solcInstance = this.bundledSolc;
      this.loadedVersion = this.bundledSolc.version();
    } catch (e) {
      out.appendLine("[Compiler] Warning: bundled solc failed to load: " + e);
      this.loadedVersion = "unavailable";
    }

    let contractFilesMap: Record<string, vscode.Uri> = {};

    cfw.$files.subscribe((files) => {
      contractFilesMap = files;
    });

    cfw.$contractOpened.subscribe((file) => {
      if (contractFilesMap[file.path]) {
        this.openedContract = file;
        resources.openedContract = file.path;
      }
    });

    cfw.$contractSaved.subscribe((file) => {
      if (resources.autoCompile) {
        this.compile(file);
      }
    });

    cfw.$files.subscribe((files) => {
      if (this.openedContract) {
        if (!files[this.openedContract.path]) {
          this.openedContract = undefined;
          resources.openedContract = undefined;
        }
      } else {
        const openEditorFile = vscode.window.activeTextEditor?.document.uri;
        if (files[openEditorFile?.path || ""]) {
          this.openedContract = openEditorFile;
          resources.openedContract = openEditorFile?.path;
        }
      }
      this.files = Object.values(files);
      resources.contracts = this.files.map((uri) => uri.path);
    });

    if (resources.autoCompile) {
      cfw.$files.pipe(first()).subscribe(() => this.compileAll());
    }

    // Expose compiler state to the webview
    resources.solcVersion = this.loadedVersion;
    resources.solcVersions = [];
    resources.solcVersionLoading = false;

    // Kick off background version-list fetch
    this.refreshVersionList();

    this.api = {
      compile: () => {
        if (this.openedContract) {
          this.compile(this.openedContract).then((success) => {
            if (!success) {
              out.show();
            }
          });
        }
      },
    };
  }

  /** Fetch the release list and publish it to the webview via resources. */
  public async refreshVersionList() {
    this.resources.solcVersionLoading = true;
    try {
      this.availableVersions = await fetchSolcVersionList();
      this.resources.solcVersions = this.availableVersions.map(
        (v) => v.longVersion,
      );
    } catch (e) {
      this.out.appendLine("[Compiler] Failed to fetch solc version list: " + e);
      this.resources.solcVersions = this.loadedVersion
        ? [this.loadedVersion]
        : [];
    } finally {
      this.resources.solcVersionLoading = false;
    }
  }

  /**
   * Switch the active solc instance.
   * Uses the bundled binary when the requested version matches it; otherwise
   * downloads the binary from soliditylang.org CDN.
   */
  public async setSolcVersion(longVersion: string) {
    if (longVersion === this.loadedVersion) {
      return;
    }

    const release = this.availableVersions.find(
      (v) => v.longVersion === longVersion,
    );
    if (!release) {
      this.out.appendLine(
        "[Compiler] Version not found in list: " + longVersion,
      );
      return;
    }

    // Check if this is the bundled version (avoid re-download)
    const bundledVer = this.bundledSolc
      ? (this.bundledSolc.version() as string)
      : null;
    if (bundledVer && longVersion === bundledVer) {
      this.solcInstance = this.bundledSolc;
      this.loadedVersion = bundledVer;
      this.resources.solcVersion = bundledVer;
      return;
    }

    this.out.appendLine("[Compiler] Downloading solc " + longVersion + " ...");
    this.resources.solcVersionLoading = true;
    try {
      this.solcInstance = await loadSolcVersion(release);
      this.loadedVersion = longVersion;
      this.resources.solcVersion = longVersion;
      this.out.appendLine("[Compiler] Loaded solc " + longVersion + " ✓");
    } catch (e) {
      this.out.appendLine(
        "[Compiler] Failed to load solc " + longVersion + ": " + e,
      );
      vscode.window.showErrorMessage(
        "remix-light: Failed to load solc " +
          longVersion +
          ". Check the Output channel for details.",
      );
    } finally {
      this.resources.solcVersionLoading = false;
    }
  }

  subscribeResources($resourceSet: ResourceSetObservable) {
    $resourceSet.subscribe((msg) => {
      switch (msg.resource) {
        case "useCompiler":
          break;
        case "autoCompile":
          if (msg.data) {
            this.compileAll();
          }
          break;
        case "openedContract": {
          const file = this.pathToUri(msg.data as string);
          if (file) {
            this.openedContract = file;
            vscode.workspace
              .openTextDocument(file)
              .then((td) => vscode.window.showTextDocument(td));
          }
          break;
        }
        case "solcVersion":
          this.setSolcVersion(msg.data as string);
          break;
      }
    });
  }

  private findImports(path: string) {
    if (path === "lib.sol")
      return {
        contents:
          "library L { function f() internal returns (uint) { return 7; } }",
      };
    return { error: "File not found" };
  }

  public pathToUri(path: string) {
    return this.files.find((f) => f.path.includes(path));
  }

  public compileAll() {
    for (const file of this.files) {
      this.compile(file);
    }
  }

  public async compile(file: vscode.Uri) {
    if (!this.resources.useCompiler) {
      return true;
    }

    if (!this.solcInstance) {
      this.out.appendLine(
        "[Compiler] No solc instance available. Cannot compile.",
      );
      return false;
    }

    const content = (await vscode.workspace.openTextDocument(file)).getText();
    const input = {
      language: "Solidity",
      sources: { [file.path]: { content } },
      settings: {
        outputSelection: { "*": { "*": ["*"] } },
        evmVersion: "shanghai",
      },
    };

    const splits = file.path.split("/");
    const shortPath =
      splits[splits.length - 2] + "/" + splits[splits.length - 1];

    let output;
    try {
      output = JSON.parse(
        this.solcInstance.compile(JSON.stringify(input), {
          import: this.findImports,
        }),
      );
    } catch (e) {
      this.out.appendLine("[Compiler] Compile exception: " + e);
      return false;
    }

    type SolcError = { severity: string; formattedMessage: string };
    const errors = ((output.errors as SolcError[]) || []).filter(
      (e) => e.severity === "error",
    );
    const warnings = ((output.errors as SolcError[]) || []).filter(
      (e) => e.severity === "warning",
    );

    for (const w of warnings) {
      this.out.appendLine("[Warning] " + w.formattedMessage);
    }

    if (errors.length > 0) {
      for (const e of errors) {
        this.out.appendLine(e.formattedMessage);
      }
      return false;
    }

    this.out.appendLine(
      "Compiled: " + file.path + " [solc " + this.loadedVersion + "]\n",
    );

    if (!output.contracts) {
      return true;
    }

    const compiledContracts: Record<string, CompiledContract> = {};
    (Object.entries(output.contracts[file.path]) as [string, unknown][])
      .map(([name, raw]) => {
        const r = raw as {
          abi: CompiledContract["abi"];
          evm: { bytecode: { object: string } };
        };
        return { name, abi: r.abi, bytecode: r.evm.bytecode.object };
      })
      .forEach((c) => {
        const id = file.path + "/" + c.name;
        compiledContracts[id] = { ...c, name: c.name + " - " + shortPath, id };
      });

    this.resources.compiledContracts = {
      ...(this.resources.compiledContracts as object),
      ...compiledContracts,
    };
    return true;
  }
}
