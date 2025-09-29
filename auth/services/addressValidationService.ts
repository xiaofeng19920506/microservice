import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface RadarAddressValidationResponse {
  meta: {
    code: number;
  };
  addresses: Array<{
    addressLabel: string;
    number: string;
    street: string;
    city: string;
    state: string;
    stateCode: string;
    postalCode: string;
    county: string;
    countryCode: string;
    formattedAddress: string;
    layer: string;
    latitude: number;
    longitude: number;
    geometry: {
      type: string;
      coordinates: number[];
    };
    distance: number;
    confidence: string; // "exact" | "high" | "medium" | "low"
    country: string;
    countryFlag: string;
    timeZone: {
      id: string;
      name: string;
      code: string;
      currentTime: string;
      utcOffset: number;
      dstOffset: number;
    };
  }>;
}

interface AddressValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  confidence?: string;
  error?: string;
}

export class AddressValidationService {
  private apiKey: string;
  private publicKey: string;
  private baseUrl: string = 'https://api.radar.io/v1';

  constructor() {
    this.apiKey = process.env.RADAR_TEST_SECRET || '';
    this.publicKey = process.env.RADAR_TEST_PUBLIC || '';
    
    if (!this.apiKey) {
      console.warn(
        '⚠️ Warning: RADAR_TEST_SECRET not found in environment variables. Address validation will be disabled.'
      );
    }
    
    if (!this.publicKey) {
      console.warn(
        '⚠️ Warning: RADAR_TEST_PUBLIC not found in environment variables. Client-side features may be limited.'
      );
    }
  }

  /**
   * Validates an address using Radar's Address Validation API
   * @param address - The address object containing street, city, state, zipCode
   * @returns Promise<AddressValidationResult>
   */
  async validateAddress(address: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    zipCode: string;
  }): Promise<AddressValidationResult> {
    if (!this.apiKey) {
      return {
        isValid: false,
        error: 'Address validation service not configured',
      };
    }

    try {
      // Format the address for Radar API geocoding
      const queryAddress = `${address.streetAddress}, ${address.city}, ${address.stateProvince} ${address.zipCode}`;
      
      console.log('Making Radar API request to:', `${this.baseUrl}/geocode/forward`);
      console.log('Query address:', queryAddress);
      
      const response = await axios.get<RadarAddressValidationResponse>(
        `${this.baseUrl}/geocode/forward`,
        {
          headers: {
            Authorization: this.apiKey, // ✅ No "Bearer"
          },
          params: {
            query: queryAddress,
            layers: 'address' // Focus on address layer as shown in the sample
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      console.log('Radar API response:', JSON.stringify(data, null, 2));

      if (!data.addresses || data.addresses.length === 0) {
        return {
          isValid: false,
          error: 'Address not found',
        };
      }

      const validatedAddress = data.addresses[0];

      // ✅ Accept exact, high, or medium
      const isValid =
        validatedAddress.confidence === 'exact' ||
        validatedAddress.confidence === 'high' ||
        validatedAddress.confidence === 'medium';

      return {
        isValid,
        formattedAddress: validatedAddress.formattedAddress,
        latitude: validatedAddress.latitude,
        longitude: validatedAddress.longitude,
        confidence: validatedAddress.confidence,
      };
    } catch (error: any) {
      console.error('❌ Error validating address with Radar API:', error.message);

      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          'Unknown API error';

        switch (status) {
          case 400:
            return { isValid: false, error: `Invalid address format: ${message}` };
          case 401:
            return { isValid: false, error: 'Invalid API key' };
          case 429:
            return { isValid: false, error: 'Rate limit exceeded' };
          case 500:
            return {
              isValid: false,
              error: 'Address validation service temporarily unavailable',
            };
          default:
            return {
              isValid: false,
              error: `Address validation failed: ${message}`,
            };
        }
      } else if (error.code === 'ECONNABORTED') {
        return { isValid: false, error: 'Address validation request timed out' };
      } else {
        return { isValid: false, error: 'Network error during address validation' };
      }
    }
  }

  /**
   * Validates multiple addresses in batch
   * @param addresses - Array of address objects
   * @returns Promise<AddressValidationResult[]>
   */
  async validateAddresses(addresses: Array<{
    streetAddress: string;
    city: string;
    stateProvince: string;
    zipCode: string;
  }>): Promise<AddressValidationResult[]> {
    const validationPromises = addresses.map((address) =>
      this.validateAddress(address)
    );

    try {
      return await Promise.all(validationPromises);
    } catch (error) {
      console.error('❌ Error in batch address validation:', error);
      return addresses.map(() => ({
        isValid: false,
        error: 'Batch validation failed',
      }));
    }
  }

  /**
   * Check if the address validation service is configured and available
   * @returns boolean
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get the public key for client-side Radar SDK initialization
   * @returns string | null
   */
  getPublicKey(): string | null {
    return this.publicKey || null;
  }

  /**
   * Get client-side configuration for Radar SDK
   * @returns object with public key and configuration
   */
  getClientConfig(): { publicKey: string | null; isConfigured: boolean } {
    return {
      publicKey: this.publicKey || null,
      isConfigured: !!this.publicKey,
    };
  }
}

// Export a singleton instance
export const addressValidationService = new AddressValidationService();
