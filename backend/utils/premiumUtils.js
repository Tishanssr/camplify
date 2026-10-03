export const isPremiumActive = (user) => {
    if (!user) return false;
    if (!user.isPremium) return false;
    if (!user.premiumExpiresAt) return false;
    return new Date(user.premiumExpiresAt) > new Date();
};

