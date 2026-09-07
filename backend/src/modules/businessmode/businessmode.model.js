import mongoose from "mongoose"


const b2bSettingsSchema = new mongoose.Schema(
  {
    //  access & login gating
    requireCompanyRegistration: { type: Boolean, default: false },
    requireApprovalForOrders: { type: Boolean, default: false },
    loginMandatoryToViewProducts: { type: Boolean, default: true },
    loginMandatoryToViewPrices: { type: Boolean, default: false },
    loginMandatoryForCheckout: { type: Boolean, default: false },
    loginMandatoryForPayment: { type: Boolean, default: false },
    loginRequiredForCartItems: { type: Boolean, default: false },
    allowGuestCheckout: { type: Boolean, default: true },
    allowGuestToViewProducts: { type: Boolean, default: true },
    allowGuestToAddToCart: { type: Boolean, default: true },
    allowGuestToWishlist: { type: Boolean, default: true },

    //  ordering
    allowBulkOrdering: { type: Boolean, default: true },
    minimumOrderQuantity: { type: Number, min: 0, default: 1 },
    minimumOrderValue: { type: Number, min: 0, default: 0 },
    enableReorderFeature: { type: Boolean, default: true },
    enableQuoteRequests: { type: Boolean, default: true },
      
    //  pricing
    showWholesalePricing: { type: Boolean, default: true },
    hideRetailPrices: { type: Boolean, default: false },
    showPriceAfterLogin: { type: Boolean, default: false },
    hidePricesForGuest: { type: Boolean, default: true },
    showDiscountPercentage: { type: Boolean, default: true },
    showTaxDetails: { type: Boolean, default: true },
    showJewelryPrice: { type: Boolean, default: false },
    // showDiamondPrice: { type: Boolean, default: false },

    // - credit
    enableCreditTerms: { type: Boolean, default: false },
    creditLimit: { type: Number, min: 0, default: 0 },
    paymentTermsDays: { type: Number, min: 0, default: 30 },

    // - storefront surface
    enableWishlist: { type: Boolean, default: true },
    enableProductReviews: { type: Boolean, default: false },
    showStockAvailability: { type: Boolean, default: true },
    showCheckoutPage: { type: Boolean, default: true },
    showPaymentPage: { type: Boolean, default: true },
    showCartSummary: { type: Boolean, default: true },
    showOrderHistory: { type: Boolean, default: true },
    enableMultipleShippingAddresses: { type: Boolean, default: true },
  },
  { _id: false },
)

const b2cSettingsSchema = new mongoose.Schema(
  {
    //  pricing
    showRetailPricing: { type: Boolean, default: true },
    showPriceAfterLogin: { type: Boolean, default: false },
    hidePricesForGuest: { type: Boolean, default: false },
    showDiscountPercentage: { type: Boolean, default: true },
    showTaxDetails: { type: Boolean, default: true },
    showComparePrice: { type: Boolean, default: true },
    showJewelryPrice: { type: Boolean, default: true },
    // showDiamondPrice: { type: Boolean, default: true },

    //  access & login gating
    allowGuestCheckout: { type: Boolean, default: true },
    allowGuestToViewProducts: { type: Boolean, default: true },
    allowGuestToAddToCart: { type: Boolean, default: true },
    allowGuestToWishlist: { type: Boolean, default: true },
    loginMandatoryToViewProducts: { type: Boolean, default: false },
    loginMandatoryToViewPrices: { type: Boolean, default: false },
    loginMandatoryForCheckout: { type: Boolean, default: false },
    loginMandatoryForPayment: { type: Boolean, default: false },
    loginMandatoryForWishlist: { type: Boolean, default: false },

    // - storefront surface
    enableWishlist: { type: Boolean, default: true },
    enableProductReviews: { type: Boolean, default: true },
    showStockAvailability: { type: Boolean, default: true },
    enableLoyaltyProgram: { type: Boolean, default: false },
    enableProductComparison: { type: Boolean, default: true },
    enableRecentlyViewed: { type: Boolean, default: true },
    showCheckoutPage: { type: Boolean, default: true },
    showPaymentPage: { type: Boolean, default: true },
    showCartSummary: { type: Boolean, default: true },
    showOrderHistory: { type: Boolean, default: true },

    //  ordering
    minimumOrderValue: { type: Number, min: 0, default: 0 },
    maximumOrderQuantity: { type: Number, min: 0, default: 100 },
    showCoupons : { type: Boolean, default: true },

  },
  { _id: false },
)

export const businessModeSchema = new mongoose.Schema(
  {

    mode: { type: String, enum: ["B2B", "B2C"], default: "B2C", required: true },
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    
    //  settings
    b2bSettings: { type: b2bSettingsSchema, default: () => ({}) },
    b2cSettings: { type: b2cSettingsSchema, default: () => ({}) },
    
    isActive: { type: Boolean, default: true, index: true },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },


  },
  { timestamps: true },
)

businessModeSchema.index({ parentStoreId: 1 }, { unique: true })