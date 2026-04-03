import { rmSync } from "fs";
import { join } from "path";

const outdir = "dist/desktop";

// Step 1: Clean output directory
rmSync(outdir, { recursive: true, force: true });

// Step 2: Bundle desktop app
const result = await Bun.build({
    entrypoints: ["src/desktop/index.tsx"],
    outdir,
    target: "browser",
    splitting: true,
});

if (!result.success) {
    console.error("Desktop build failed:");
    for (const log of result.logs) {
        console.error(log);
    }
    process.exit(1);
}

console.log(
    `Bundled ${result.outputs.length} files to ${outdir}/`,
);
