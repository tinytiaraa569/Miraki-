import mongoose from "mongoose"

// TENANT-DB SCHEMA: the MATERIALIZED membership set — one document per
// (collection, product) pair (see COLLECTIONS_SYSTEM_PLAN.md §6).
//
// Denormalizing the sort keys (`sortName`, `price`, `createdAt`, `position`)
// onto the member doc means a storefront/admin listing can sort + paginate
// ENTIRELY within `collectionMembers` using a covered index, then do a single
// $in into products for just the ~24 rows on the current page — never a full
// product scan.
//
// `buildVersion` scopes each rebuild so a new version can be written in full
// before the collection doc atomically flips to it (zero-downtime swap); the
// old version is GC'd afterwards.

export const collectionMemberSchema = new mongoose.Schema(
  {
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, required: true },
    collectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    buildVersion: { type: Number, required: true }, // matches collection.membership.buildVersion

    // Denormalized sort keys so listing needs NO $lookup into products:
    sortName: { type: String, default: "" },
    price: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }, // product createdAt (for "newest")
    position: { type: Number, default: 0 }, // manual order / rule rank
  },
  { timestamps: false },
)

// The indexes that make listing O(log n) + a range scan, never a product scan:
collectionMemberSchema.index({ parentStoreId: 1, collectionId: 1, buildVersion: 1, position: 1 })
collectionMemberSchema.index({ parentStoreId: 1, collectionId: 1, buildVersion: 1, price: 1 })
collectionMemberSchema.index({ parentStoreId: 1, collectionId: 1, buildVersion: 1, sortName: 1 })
collectionMemberSchema.index({ parentStoreId: 1, productId: 1 }) // reverse: which collections a product is in
