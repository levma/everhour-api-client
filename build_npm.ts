import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

const appConfig = JSON.parse(Deno.readTextFileSync("./deno.json"));

await build({
  entryPoints: ["./main.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  package: {
    name: appConfig.name,
    version: appConfig.version,
    description: "API client for Everhour",
    license: appConfig.license,
    repository: {
      type: "git",
      url: "git+https://github.com/levma/everhour-api-client.git",
    },
    bugs: {
      url: "https://github.com/levma/everhour-api-client/issues",
    },
  },
  test: false,
  filterDiagnostic(diagnostic) {
    if (diagnostic.file?.fileName === "main_test.ts") {
      return false;
    }
    return true;
  },

  postBuild() {
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
