const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const getApiUrl = (endpoint: string) => {
  const base = baseURL.replace(/\/$/, "");
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  return `${base}${path}`;
};

export interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface AddressInput {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
}

// Add address to user
export const addAddress = async (
  userId: string,
  addressData: AddressInput,
  token: string
): Promise<{ success: boolean; addresses: Address[]; message: string }> => {
  const response = await fetch(getApiUrl(`/users/${userId}/addresses`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add address");
  }

  return await response.json();
};

// Update address
export const updateAddress = async (
  userId: string,
  addressId: string,
  addressData: Partial<AddressInput>,
  token: string
): Promise<{ success: boolean; addresses: Address[]; message: string }> => {
  const url = getApiUrl(`/users/${userId}/addresses/${addressId}`);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Update address error:", error);
    throw new Error(error.message || "Failed to update address");
  }

  const result = await response.json();
  return result;
};

// Delete address
export const deleteAddress = async (
  userId: string,
  addressId: string,
  token: string
): Promise<{ success: boolean; addresses: Address[]; message: string }> => {
  const url = getApiUrl(`/users/${userId}/addresses/${addressId}`);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Delete address error:", error);
    throw new Error(error.message || "Failed to delete address");
  }

  const result = await response.json();
  return result;
};
