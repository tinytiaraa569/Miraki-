import { z } from "zod"


const b2bSettingsBody = z
  .object({
    // access & login gating
    requireCompanyRegistration: z.boolean().optional(),
    requireApprovalForOrders: z.boolean().optional(),
    loginMandatoryToViewProducts: z.boolean().optional(),
    loginMandatoryToViewPrices: z.boolean().optional(),
    loginMandatoryForCheckout: z.boolean().optional(),
    loginMandatoryForPayment: z.boolean().optional(),
    loginRequiredForCartItems: z.boolean().optional(),
    allowGuestCheckout: z.boolean().optional(),
    allowGuestToViewProducts: z.boolean().optional(),
    allowGuestToAddToCart: z.boolean().optional(),
    allowGuestToWishlist: z.boolean().optional(),

    // ordering
    allowBulkOrdering: z.boolean().optional(),
    minimumOrderQuantity: z.number().int().min(0).max(1000000).optional(),
    minimumOrderValue: z.number().min(0).optional(),
    enableReorderFeature: z.boolean().optional(),
    enableQuoteRequests: z.boolean().optional(),

    // pricing
    showWholesalePricing: z.boolean().optional(),
    hideRetailPrices: z.boolean().optional(),
    showPriceAfterLogin: z.boolean().optional(),
    hidePricesForGuest: z.boolean().optional(),
    showDiscountPercentage: z.boolean().optional(),
    showTaxDetails: z.boolean().optional(),
    showJewelryPrice: z.boolean().optional(),
    // showDiamondPrice: z.boolean().optional(),

    // credit
    enableCreditTerms: z.boolean().optional(),
    creditLimit: z.number().min(0).optional(),
    paymentTermsDays: z.number().int().min(0).max(3650).optional(),

    // storefront surface
    enableWishlist: z.boolean().optional(),
    enableProductReviews: z.boolean().optional(),
    showStockAvailability: z.boolean().optional(),
    showCheckoutPage: z.boolean().optional(),
    showPaymentPage: z.boolean().optional(),
    showCartSummary: z.boolean().optional(),
    showOrderHistory: z.boolean().optional(),
    enableMultipleShippingAddresses: z.boolean().optional(),
  })
  .strict()

const b2cSettingsBody = z
  .object({
    // pricing
    showRetailPricing: z.boolean().optional(),
    showPriceAfterLogin: z.boolean().optional(),
    hidePricesForGuest: z.boolean().optional(),
    showDiscountPercentage: z.boolean().optional(),
    showTaxDetails: z.boolean().optional(),
    showComparePrice: z.boolean().optional(),
    showJewelryPrice: z.boolean().optional(),
    // showDiamondPrice: z.boolean().optional(),

    // access & login gating
    allowGuestCheckout: z.boolean().optional(),
    allowGuestToViewProducts: z.boolean().optional(),
    allowGuestToAddToCart: z.boolean().optional(),
    allowGuestToWishlist: z.boolean().optional(),
    loginMandatoryToViewProducts: z.boolean().optional(),
    loginMandatoryToViewPrices: z.boolean().optional(),
    loginMandatoryForCheckout: z.boolean().optional(),
    loginMandatoryForPayment: z.boolean().optional(),
    loginMandatoryForWishlist: z.boolean().optional(),

    // storefront surface
    enableWishlist: z.boolean().optional(),
    enableProductReviews: z.boolean().optional(),
    showStockAvailability: z.boolean().optional(),
    enableLoyaltyProgram: z.boolean().optional(),
    enableProductComparison: z.boolean().optional(),
    enableRecentlyViewed: z.boolean().optional(),
    showCheckoutPage: z.boolean().optional(),
    showPaymentPage: z.boolean().optional(),
    showCartSummary: z.boolean().optional(),
    showOrderHistory: z.boolean().optional(),

    // ordering
    minimumOrderValue: z.number().min(0).optional(),
    maximumOrderQuantity: z.number().int().min(0).max(1000000).optional(),
    showCoupons : z.boolean().optional(),
  })
  .strict()

const businessModeBody = z
  .object({
    mode: z.enum(["B2B", "B2C"]).optional(),
    b2bSettings: b2bSettingsBody.optional(),
    b2cSettings: b2cSettingsBody.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const createBusinessModeSchema = businessModeBody

export const updateBusinessModeSchema = businessModeBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })