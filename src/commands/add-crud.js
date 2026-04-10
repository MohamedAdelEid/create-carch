#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { write, exists } from "../utils/fs.js";
import { nameVariants } from "../utils/naming.js";
import {
  entityTemplate, entityTypesTemplate, apiTypesTemplate, apiTemplate,
  useListHookTemplate, useMutationsHookTemplate,
  columnsTemplate, formTemplate, createDialogTemplate, editDialogTemplate,
  deleteDialogTemplate, pageTemplate,
} from "../templates/crud/crud.templates.js";

const [, , , moduleName, entityRaw] = process.argv;

if (!moduleName || !entityRaw) {
  console.error(pc.red("Usage: carch add:crud <module> <entity>"));
  process.exit(1);
}

const base    = process.cwd();
const modRoot = path.join(base, "src", "modules", moduleName);
const n       = nameVariants(entityRaw);

p.intro(pc.bgCyan(pc.black(" carch ")) + `  add:crud ${moduleName} / ${pc.bold(n.pascal)}`);

if (!exists(modRoot)) {
  p.log.error(`Module "${moduleName}" not found. Run: carch add:module ${moduleName}`);
  process.exit(1);
}

const spinner = p.spinner();
spinner.start(`Generating CRUD for ${n.pascal}`);

write(path.join(modRoot, "domain", "entities",  `${n.camel}.entity.ts`),      entityTemplate(n));
write(path.join(modRoot, "domain", "types",      `${n.camel}.types.ts`),       entityTypesTemplate(n));
write(path.join(modRoot, "infrastructure", "api", `${n.plural}.api.types.ts`), apiTypesTemplate(n));
write(path.join(modRoot, "infrastructure", "api", `${n.plural}.api.ts`),        apiTemplate(n, moduleName));
write(path.join(modRoot, "application", "hooks", `use${n.pluralPascal}.ts`),    useListHookTemplate(n, moduleName));
write(path.join(modRoot, "application", "hooks", `use${n.pascal}Mutations.ts`), useMutationsHookTemplate(n));

const compDir = path.join(modRoot, "presentation", "components", n.plural);
write(path.join(compDir, `${n.pascal}Columns.tsx`),      columnsTemplate(n));
write(path.join(compDir, `${n.pascal}Form.tsx`),         formTemplate(n));
write(path.join(compDir, `Create${n.pascal}Dialog.tsx`), createDialogTemplate(n));
write(path.join(compDir, `Edit${n.pascal}Dialog.tsx`),   editDialogTemplate(n));
write(path.join(compDir, `Delete${n.pascal}Dialog.tsx`), deleteDialogTemplate(n));

write(path.join(modRoot, "presentation", "pages", `${n.pluralPascal}Page.tsx`), pageTemplate(n, moduleName));

spinner.stop(`CRUD for ${pc.bold(n.pascal)} generated`);

p.outro([
  pc.green("Files created:"),
  `  domain/entities/${n.camel}.entity.ts`,
  `  domain/types/${n.camel}.types.ts`,
  `  infrastructure/api/${n.plural}.api.ts`,
  `  application/hooks/use${n.pluralPascal}.ts`,
  `  application/hooks/use${n.pascal}Mutations.ts`,
  `  presentation/components/${n.plural}/  (5 files)`,
  `  presentation/pages/${n.pluralPascal}Page.tsx`,
  "",
  pc.dim(`Add route: src/app/(${moduleName})/${n.plural}/page.tsx`),
].join("\n"));
