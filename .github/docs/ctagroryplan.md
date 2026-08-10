Adapts the concept in docs/CATEGORY_SYSTEM_PLAN.md to THIS codebase's real
architecture. The existing doc is generic (TypeScript, companyId, global
mongoose.model, path regex string). Our implementation instead matches the
substore module exactly:

Tenant-DB per seller via getTenantModels(tenantDbName) — register a new
Category model in backend/src/config/tenantDb.js.
Scope every query by parentStoreId = seller.mainStoreId + deletedAt
(soft-delete), like substore.service.js.
Plain JS/JSX, base64 uploads (no multer), owner-only routes.
Aggregation pipeline for all reads (per user request).
Tree stored with parentId + ancestors: [ObjectId] array (root→parent)

depth + denormalized childrenCount. Using an ancestors array
(not a comma path string) makes subtree/cascade/move queries safe with
{ ancestors: id } — no regex injection.




Core data model decisions

Lazy loading key = childrenCount. The tree draws the expand chevron
purely from this number — zero extra requests to know if a node is expandable.
Roots first, children on expand. GET ?parentId=null returns level-0 only;
expanding a node calls GET ?parentId=<id> for its direct children. Repeats to
any depth (N-level).
Cascade soft-delete subtree (confirmed): deleting a node soft-deletes it +
all descendants ({ ancestors: id }) in one update; restore brings the whole
subtree back; childrenCount on the parent is decremented.
Move / reparent (confirmed): editing the Parent recomputes ancestors +
depth for the node and every descendant, with a cycle guard (cannot move a
node into its own subtree). Recount old + new parent.
Images (confirmed, no multer): base64 data URL in JSON → written to
uploads/category/<categoryId>/<file>, only the URL string persisted.


Backend — new module backend/src/modules/categories/
1. category.model.js (tenant schema)
Fields (StoreHippo-mapped, all optional except name):

Identity: name (req), alias (auto-slug in pre('validate') like substore),
description, images: [{ url, alt }], sortOrder, status
(active|inactive), isActive.
Tree: parentStoreId (ref Store, index), parentId (ObjectId|null, index),
ancestors: [ObjectId] (index), depth (Number), childrenCount (Number).
StoreHippo blocks: seo {title, description, keywords[], canonicalUrl},
sitemap {priority, frequency, disableForBots},
metafields: [{key, value, type}], defaultSortOrder
(manual|name_asc|name_desc|newest), widget,
substoreIds: [ObjectId] (empty = all), faqIds: [ObjectId],
facetGroupId, customFields: [{key,value}].
Soft delete: isDeleted, deletedAt, deletedBy, audit createdBy/updatedBy.
Indexes: { parentStoreId, parentId, sortOrder, name },
{ parentStoreId, alias } unique sparse, { parentStoreId, ancestors }.

2. category.validation.js (zod)
createCategorySchema (name required, rest optional), updateCategorySchema
(.partial()), moveCategorySchema ({ parentId: objectId|null }),
listCategoriesQuerySchema ({ parentId, q, status, deleted, sort, page, limit }).
Base64 image validated with the same imageDataUrl regex as substores.
3. category.service.js (aggregation-based, mirrors substore.service.js)

assertSeller scope helper; SORTS map.
listCategories — aggregation: $match {parentStoreId, parentId, deletedAt}
→ $sort → $project ONLY the columns the tree needs
(name, alias, depth, parentId, childrenCount, isActive, status, sortOrder,
first image thumb) → $addFields { hasChildren: {$gt:["$childrenCount",0]} }.
When q present: flat search across all levels (escaped regex on name/alias).
getCategory — single doc (full detail for the edit sheet).
getAncestors — aggregation $match {_id:{$in: ancestors}} for breadcrumbs.
createCategoryDoc — resolve parent → compute ancestors, depth;
alias-clash check (collation, per parentStore); create doc; if images
base64 present, save to uploads/category/<newId>/ then patch images;
$inc childrenCount on parent; audit seller.category.created.
updateCategoryDoc — field merge (excluding parent — that goes through
move); handle image add/remove; alias-clash guard; audit.
moveCategoryDoc — cycle guard (newParent cannot be self/descendant);
recompute ancestors+depth for node; rewrite all descendants
({ ancestors: id }, splice ancestor prefix + shift depth); recount both
parents; audit seller.category.moved.
deleteCategoryDoc — cascade soft-delete: set deletedAt on node +
{ ancestors: id }; decrement parent childrenCount; audit.
restoreCategoryDoc — restore subtree; re-increment parent count;
alias-clash guard on the node.
destroyCategoryDoc — permanent delete of an already-trashed subtree;
remove uploads/category/<id>/ images via new util.

4. category.controller.js + category.routes.js
Same shape as substore: ctx(req), asyncHandler, owner-only guard
(authenticate, loadUser, requireRole('SELLER_SUPERADMIN')).
Routes: GET /, GET /:id, GET /:id/ancestors, POST /, PATCH /:id,
PATCH /:id/move, POST /:id/restore, DELETE /:id (?permanent=true → destroy).
5. Wiring

backend/src/config/tenantDb.js — add
Category: conn.models.Category || conn.model("Category", categorySchema, "categories").
backend/src/app.js — add express.json({ limit: "8mb" }) for
/api/seller/categories (base64 images) and mount categoryRoutes at
/api/seller/categories BEFORE the general sellerRoutes.
backend/src/utils/uploads.js — add saveCategoryImage({ categoryId, dataUrl })
→ writes to uploads/category/<categoryId>/<rand>.<ext>, returns
/uploads/category/<categoryId>/...; and deleteCategoryImage. Reuses the
existing parseDataUrl/assertSafeId (24-hex ObjectId) guards.


Frontend — /hub/products/categories
Nav entry already exists in seller-nav.js (Categories), and findNavMatch
already resolves its title. Only need a dedicated route + page.
1. frontend/src/App.jsx
Add const HubCategoriesPage = lazy(() => import("@/pages/hub/categories-page"))
and <Route path="products/categories" element={<HubCategoriesPage />} />
BEFORE the path="*" catch-all (so it wins over HubModulePage).
2. frontend/src/pages/hub/categories-page.jsx
Two-pane layout: left = lazy CategoryTree (roots via
useSWR('/api/seller/categories?parentId=null')), toolbar with search +
"Add Category" + Trash toggle; right/overlay = CategoryFormSheet.
Selecting a node opens the sheet in edit mode; "Add" opens create mode
(optionally pre-filled parent = selected node). Uses imgUrl from @/Server
for thumbnails, toast (sonner), and api/fetcher from @/lib/api.
3. frontend/src/components/hub/category-tree.jsx
CategoryTree + CategoryNode. Each node keeps local open state; children
fetched lazily with useSWR(open ? '/api/seller/categories?parentId=<id>' : null).
Chevron shown only when hasChildren. Indent by depth. Skeleton while loading.
Built with plain state + ScrollArea (no collapsible primitive needed).
4. frontend/src/components/hub/category-form-sheet.jsx
Sheet slide-over (matches SubstoreFormSheet pattern). Sections via existing
Tabs (General / SEO / Sitemap / Advanced) instead of Accordion (not in kit):

General: Name, Alias, Description (Textarea), Parent picker (from tree /
flat list, excludes self+descendants), Image upload (base64 preview), Active,
Status, Sort Order, Default Sort Order.
SEO: title, description, keywords, canonical URL.
Sitemap: priority, frequency (Select), disable-for-bots (Switch).
Advanced: metafields key/value editor, substore multi-select, widget.
On save: POST (create) or PATCH (update); Parent change → PATCH /:id/move.
mutate the affected parentId SWR keys so the tree refreshes in place.

5. Constants
Add CATEGORY_STATUSES + sort/frequency option arrays to
frontend/src/lib/store-data.js (co-located with SUBSTORE_STATUSES).

Files summary
Create (backend): categories/category.model.js, category.validation.js,
category.service.js, category.controller.js, category.routes.js.
Edit (backend): config/tenantDb.js, app.js, utils/uploads.js.
Create (frontend): pages/hub/categories-page.jsx,
components/hub/category-tree.jsx, components/hub/category-form-sheet.jsx.
Edit (frontend): App.jsx, lib/store-data.js.
No new npm/shadcn dependencies. Existing docs/CATEGORY_SYSTEM_PLAN.md left
as-is (reference only).
Verification

Lint/build the frontend after wiring.
Manual: create roots → expand (lazy child fetch) → nest N levels → move a
subtree → soft-delete cascade → restore → permanent delete → image upload.