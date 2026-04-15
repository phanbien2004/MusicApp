import apiClient from '@/api/apiClient';

// ─── Types ────────────────────────────────────────────────────────

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    durationDays: number;
}

export interface CheckoutResponse {
    paymentUrl: string;
}

export interface MySubscriptionResponse {
    id: number | null;
    planName: string;
    subscriptionType: 'FREE' | 'PREMIUM';
    price: number;
    startDate: string | null; // "YYYY-MM-DD"
    endDate: string | null;   // "YYYY-MM-DD"
    isActive: boolean;
}

type RawSubscriptionDate = string | [number, number, number] | null | undefined;

interface RawMySubscriptionResponse {
    id?: number | null;
    planName?: string | null;
    subscriptionType?: 'FREE' | 'PREMIUM' | null;
    price?: number | null;
    startDate?: RawSubscriptionDate;
    endDate?: RawSubscriptionDate;
    isActive?: boolean | null;
    active?: boolean | null;
}

const normalizeSubscriptionDate = (value: RawSubscriptionDate): string | null => {
    if (!value) return null;

    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value;
        const paddedMonth = String(month).padStart(2, '0');
        const paddedDay = String(day).padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
    }

    if (typeof value === 'string') {
        return value;
    }

    return null;
};

const normalizeMySubscriptionResponse = (
    payload: RawMySubscriptionResponse
): MySubscriptionResponse => ({
    id: payload.id ?? null,
    planName: payload.planName ?? '',
    subscriptionType: payload.subscriptionType ?? 'FREE',
    price: payload.price ?? 0,
    startDate: normalizeSubscriptionDate(payload.startDate),
    endDate: normalizeSubscriptionDate(payload.endDate),
    isActive: Boolean(payload.isActive ?? payload.active),
});

// ─── Subscription Plan APIs ───────────────────────────────────────

/**
 * GET /api/v1/subscription-plan/all
 * Lấy toàn bộ danh sách gói Premium
 */
export const getSubscriptionPlansAPI = async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get('/api/v1/subscription-plan/all');
    return res.data as SubscriptionPlan[];
};

// ─── Payment APIs ─────────────────────────────────────────────────

/**
 * POST /api/v1/payment/checkout
 * Tạo link thanh toán PayOS cho gói được chọn
 * @returns CheckoutResponse { paymentUrl, orderCode }
 */
export const createPaymentCheckoutAPI = async (planId: number): Promise<CheckoutResponse> => {
    const res = await apiClient.post('/api/v1/payments/checkout', { planId });
    return res.data as CheckoutResponse;
};

// ─── Subscription APIs ────────────────────────────────────────────

/**
 * GET /api/v1/subscription/my
 * Lấy thông tin gói đang active của user hiện tại
 */
export const getMySubscriptionAPI = async (): Promise<MySubscriptionResponse> => {
    const res = await apiClient.get('/api/v1/subscription/my');
    return normalizeMySubscriptionResponse(res.data as RawMySubscriptionResponse);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForPremiumSubscriptionAPI = async (
    maxAttempts = 8,
    intervalMs = 1500
): Promise<MySubscriptionResponse> => {
    let latestResponse: MySubscriptionResponse | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        latestResponse = await getMySubscriptionAPI();
        if (latestResponse.isActive && latestResponse.subscriptionType === 'PREMIUM') {
            return latestResponse;
        }

        if (attempt < maxAttempts - 1) {
            await sleep(intervalMs);
        }
    }

    if (latestResponse) {
        return latestResponse;
    }

    throw new Error('Cannot verify premium subscription status.');
};
