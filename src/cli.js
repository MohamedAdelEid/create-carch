#!/usr/bin/env node
import pc from "picocolors";

const command = process.argv[2];

const routes = {
  "add:module":    "./commands/add-module.js",
  "add:crud":      "./commands/add-crud.js",
  "add:i18n":      "./commands/add-i18n.js",
  "add:auth":      "./commands/add-auth.js",
  "add:dashboard": "./commands/add-dashboard.js",
};

if (!command || command === "create") {
  import("./commands/create.js");
} else if (routes[command]) {
  import(routes[command]);
} else if (command === "--help" || command === "-h") {
  console.log(`
  ${pc.bgCyan(pc.black(" carch "))}  Clean Architecture scaffold for Next.js
  ${pc.dim("by Mohamed Adel Eid — https://github.com/MohamedAdelEid")}

  ${pc.bold("Usage:")}
    npm create carch@latest              Create a new project interactively
    carch add:module <n>              Add a new module with 4 clean layers
    carch add:crud   <module> <entity>   Generate full CRUD boilerplate
    carch add:i18n                       Add a translation namespace
    carch add:auth                       Setup the auth module (next-auth + JWT)
    carch add:dashboard                  Setup dashboard layout (shadcn sidebar + header)

  ${pc.bold("Examples:")}
    carch add:module exams
    carch add:crud teacher course
    carch add:i18n
    carch add:auth
    carch add:dashboard
`);
} else {
  console.error(`Unknown command: ${pc.red(command)}\nRun ${pc.bold("carch --help")} for usage.`);
  process.exit(1);
}
