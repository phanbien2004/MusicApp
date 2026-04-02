import apiClient from '@/api/apiClient';
import { BASE_URL } from '@/constants/baseURL';

// ─── Types ────────────────────────────────────────────────────────

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    durationDays: number;
}

export interface CheckoutResponse {
    paymentUrl: string;
    orderCode: number;
}

export interface MySubscriptionResponse {
    id: number;
    planName: string;
    price: number;
    startDate: string; // "YYYY-MM-DD"
    endDate: string;   // "YYYY-MM-DD"
    isActive: boolean;
}

// ─── Subscription Plan APIs ───────────────────────────────────────

/**
 * GET /api/v1/subscription-plan/all
 * Lấy toàn bộ danh sách gói Premium
 */
export const getSubscriptionPlansAPI = async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get(`${BASE_URL}/api/v1/subscription-plan/all`);
    return res.data as SubscriptionPlan[];
};

// ─── Payment APIs ─────────────────────────────────────────────────

/**
 * POST /api/v1/payment/checkout
 * Tạo link thanh toán PayOS cho gói được chọn
 * @returns CheckoutResponse { paymentUrl, orderCode }
 */
export const createPaymentCheckoutAPI = async (planId: number): Promise<CheckoutResponse> => {
    const res = await apiClient.post(`${BASE_URL}/api/v1/payments/checkout`, { planId });
    return res.data as CheckoutResponse;
};

// ─── Subscription APIs ────────────────────────────────────────────

/**
 * GET /api/v1/subscription/my
 * Lấy thông tin gói đang active của user hiện tại
 */
export const getMySubscriptionAPI = async (): Promise<MySubscriptionResponse> => {
    const res = await apiClient.get(`${BASE_URL}/api/v1/subscription/my`);
    return res.data as MySubscriptionResponse;
};
