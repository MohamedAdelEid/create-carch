/**
 * CRUD Templates
 * Each function returns the file content string for one generated file.
 * n = nameVariants(entityName), moduleName = raw module name
 */

export function entityTemplate(n) {
  return `import { z } from "zod";

export const ${n.pascal}Schema = z.object({
  id:        z.string(),
  name:      z.string().min(1, "Name is required"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ${n.pascal} = z.infer<typeof ${n.pascal}Schema>;
`;
}

export function entityTypesTemplate(n) {
  return `import type { ${n.pascal} } from "../entities/${n.camel}.entity";

export type Create${n.pascal}Dto = Pick<${n.pascal}, "name">;
export type Update${n.pascal}Dto = Partial<Create${n.pascal}Dto>;

export type ${n.pascal}Filters = {
  search?: string;
  page:    number;
  limit:   number;
};
`;
}

export function apiTypesTemplate(n) {
  return `import type { ${n.pascal} } from "../../domain/entities/${n.camel}.entity";
import type { PaginatedResponse } from "@/shared/domain/types/api.types";

export type Get${n.pluralPascal}Response = PaginatedResponse<${n.pascal}>;
export type Get${n.pascal}Response       = ${n.pascal};
export type Create${n.pascal}Response    = ${n.pascal};
export type Update${n.pascal}Response    = ${n.pascal};
export type Delete${n.pascal}Response    = { success: boolean };
`;
}

export function apiTemplate(n, moduleName) {
  return `import { apiClient } from "@/shared/infrastructure/http/client";
import type { Create${n.pascal}Dto, Update${n.pascal}Dto, ${n.pascal}Filters } from "../../domain/types/${n.camel}.types";
import type {
  Get${n.pluralPascal}Response,
  Get${n.pascal}Response,
  Create${n.pascal}Response,
  Update${n.pascal}Response,
  Delete${n.pascal}Response,
} from "./${n.plural}.api.types";

const BASE = "/${moduleName}/${n.plural}";

export const ${n.pluralCamel}Api = {
  getAll: (filters: ${n.pascal}Filters) =>
    apiClient.get<Get${n.pluralPascal}Response>(BASE, { params: filters }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Get${n.pascal}Response>(\`\${BASE}/\${id}\`).then((r) => r.data),

  create: (dto: Create${n.pascal}Dto) =>
    apiClient.post<Create${n.pascal}Response>(BASE, dto).then((r) => r.data),

  update: (id: string, dto: Update${n.pascal}Dto) =>
    apiClient.put<Update${n.pascal}Response>(\`\${BASE}/\${id}\`, dto).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<Delete${n.pascal}Response>(\`\${BASE}/\${id}\`).then((r) => r.data),
};
`;
}

export function useListHookTemplate(n, moduleName) {
  return `import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ${n.pluralCamel}Api } from "../../infrastructure/api/${n.plural}.api";
import type { ${n.pascal}Filters } from "../../domain/types/${n.camel}.types";

export const ${n.camel}Keys = {
  all:    ["${moduleName}", "${n.plural}"] as const,
  list:   (filters: ${n.pascal}Filters) => [...${n.camel}Keys.all, "list", filters] as const,
  detail: (id: string)                  => [...${n.camel}Keys.all, "detail", id]    as const,
};

export function use${n.pluralPascal}() {
  const [filters, setFilters] = useState<${n.pascal}Filters>({ page: 1, limit: 10 });

  const query = useQuery({
    queryKey: ${n.camel}Keys.list(filters),
    queryFn:  () => ${n.pluralCamel}Api.getAll(filters),
  });

  return { ...query, filters, setFilters };
}
`;
}

export function useMutationsHookTemplate(n) {
  return `import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ${n.pluralCamel}Api } from "../../infrastructure/api/${n.plural}.api";
import { ${n.camel}Keys } from "./use${n.pluralPascal}";
import { notify } from "@/lib/toast";
import type { Update${n.pascal}Dto } from "../../domain/types/${n.camel}.types";

export function use${n.pascal}Mutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ${n.camel}Keys.all });

  const create = useMutation({
    mutationFn: ${n.pluralCamel}Api.create,
    onSuccess: () => { invalidate(); notify.success("${n.pascal} created"); },
    onError:   () => notify.error("Failed to create ${n.pascal}"),
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Update${n.pascal}Dto }) =>
      ${n.pluralCamel}Api.update(id, dto),
    onSuccess: () => { invalidate(); notify.success("${n.pascal} updated"); },
    onError:   () => notify.error("Failed to update ${n.pascal}"),
  });

  const remove = useMutation({
    mutationFn: ${n.pluralCamel}Api.delete,
    onSuccess: () => { invalidate(); notify.success("${n.pascal} deleted"); },
    onError:   () => notify.error("Failed to delete ${n.pascal}"),
  });

  return { create, update, remove };
}
`;
}

export function columnsTemplate(n) {
  return `"use client";
import type { ColumnDef } from "@tanstack/react-table";
import type { ${n.pascal} } from "../../../domain/entities/${n.camel}.entity";

type Props = {
  onEdit:   (row: ${n.pascal}) => void;
  onDelete: (row: ${n.pascal}) => void;
};

export function use${n.pascal}Columns({ onEdit, onDelete }: Props): ColumnDef<${n.pascal}>[] {
  return [
    {
      accessorKey: "name",
      header:      "Name",
    },
    {
      accessorKey: "createdAt",
      header:      "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id:     "actions",
      header: "",
      cell:   ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => onEdit(row.original)}>Edit</button>
          <button onClick={() => onDelete(row.original)}>Delete</button>
        </div>
      ),
    },
  ];
}
`;
}

export function formTemplate(n) {
  return `"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ${n.pascal}Schema } from "../../../domain/entities/${n.camel}.entity";
import type { ${n.pascal} } from "../../../domain/entities/${n.camel}.entity";
import type { Create${n.pascal}Dto } from "../../../domain/types/${n.camel}.types";

const FormSchema = ${n.pascal}Schema.pick({ name: true });
type FormValues = z.infer<typeof FormSchema>;

type Props = {
  defaultValues?: Partial<${n.pascal}>;
  onSubmit:       (dto: Create${n.pascal}Dto) => void;
  isLoading?:     boolean;
};

export function ${n.pascal}Form({ defaultValues, onSubmit, isLoading }: Props) {
  const form = useForm<FormValues>({
    resolver:      zodResolver(FormSchema),
    defaultValues: { name: defaultValues?.name ?? "" },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input {...form.register("name")} />
        {form.formState.errors.name && (
          <p>{form.formState.errors.name.message}</p>
        )}
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
`;
}

export function createDialogTemplate(n) {
  return `"use client";
import { ${n.pascal}Form } from "./${n.pascal}Form";
import type { Create${n.pascal}Dto } from "../../../domain/types/${n.camel}.types";

type Props = {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit:     (dto: Create${n.pascal}Dto) => void;
  isLoading?:   boolean;
};

export function Create${n.pascal}Dialog({ open, onOpenChange, onSubmit, isLoading }: Props) {
  if (!open) return null;
  return (
    <div role="dialog">
      <h2>Create ${n.pascal}</h2>
      <${n.pascal}Form
        onSubmit={(dto) => { onSubmit(dto); onOpenChange(false); }}
        isLoading={isLoading}
      />
      <button onClick={() => onOpenChange(false)}>Cancel</button>
    </div>
  );
}
`;
}

export function editDialogTemplate(n) {
  return `"use client";
import { ${n.pascal}Form } from "./${n.pascal}Form";
import type { ${n.pascal} } from "../../../domain/entities/${n.camel}.entity";
import type { Update${n.pascal}Dto } from "../../../domain/types/${n.camel}.types";

type Props = {
  ${n.camel}:     ${n.pascal};
  onOpenChange: (open: boolean) => void;
  onSubmit:     (dto: Update${n.pascal}Dto) => void;
  isLoading?:   boolean;
};

export function Edit${n.pascal}Dialog({ ${n.camel}, onOpenChange, onSubmit, isLoading }: Props) {
  return (
    <div role="dialog">
      <h2>Edit ${n.pascal}</h2>
      <${n.pascal}Form
        defaultValues={${n.camel}}
        onSubmit={(dto) => { onSubmit(dto); onOpenChange(false); }}
        isLoading={isLoading}
      />
      <button onClick={() => onOpenChange(false)}>Cancel</button>
    </div>
  );
}
`;
}

export function deleteDialogTemplate(n) {
  return `"use client";

type Props = {
  open:         boolean;
  onConfirm:    () => void;
  onOpenChange: (open: boolean) => void;
  isLoading?:   boolean;
};

export function Delete${n.pascal}Dialog({ open, onConfirm, onOpenChange, isLoading }: Props) {
  if (!open) return null;
  return (
    <div role="dialog">
      <p>Are you sure you want to delete this ${n.pascal}?</p>
      <button onClick={onConfirm} disabled={isLoading}>
        {isLoading ? "Deleting..." : "Delete"}
      </button>
      <button onClick={() => onOpenChange(false)}>Cancel</button>
    </div>
  );
}
`;
}

export function pageTemplate(n, moduleName) {
  return `"use client";
import { useState } from "react";
import { use${n.pluralPascal} } from "../../application/hooks/use${n.pluralPascal}";
import { use${n.pascal}Mutations } from "../../application/hooks/use${n.pascal}Mutations";
import { use${n.pascal}Columns } from "../components/${n.plural}/${n.pascal}Columns";
import { Create${n.pascal}Dialog } from "../components/${n.plural}/Create${n.pascal}Dialog";
import { Edit${n.pascal}Dialog } from "../components/${n.plural}/Edit${n.pascal}Dialog";
import { Delete${n.pascal}Dialog } from "../components/${n.plural}/Delete${n.pascal}Dialog";
import { DataTable } from "@/shared/presentation/components/DataTable";
import { Pagination } from "@/shared/presentation/components/Pagination";
import type { ${n.pascal} } from "../../domain/entities/${n.camel}.entity";

export function ${n.pluralPascal}Page() {
  const [createOpen, setCreateOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState<${n.pascal} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<${n.pascal} | null>(null);

  const { data, isLoading, filters, setFilters } = use${n.pluralPascal}();
  const { create, update, remove }               = use${n.pascal}Mutations();

  const columns = use${n.pascal}Columns({
    onEdit:   setEditTarget,
    onDelete: setDeleteTarget,
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>${n.pluralPascal}</h1>
        <button onClick={() => setCreateOpen(true)}>+ Create</button>
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />

      <Pagination
        total={data?.total ?? 0}
        page={filters.page}
        limit={filters.limit}
        onChange={(page) => setFilters((f) => ({ ...f, page }))}
      />

      <Create${n.pascal}Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(dto) => create.mutate(dto)}
        isLoading={create.isPending}
      />

      {editTarget && (
        <Edit${n.pascal}Dialog
          ${n.camel}={editTarget}
          onOpenChange={() => setEditTarget(null)}
          onSubmit={(dto) => update.mutate({ id: editTarget.id, dto })}
          isLoading={update.isPending}
        />
      )}

      <Delete${n.pascal}Dialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id)}
        onOpenChange={() => setDeleteTarget(null)}
        isLoading={remove.isPending}
      />
    </div>
  );
}
`;
}
