# Radar Address Validation - Client-Side Usage

This guide shows how to use both the Radar secret key (server-side) and public key (client-side) for comprehensive address validation.

## Environment Variables

Add these to your `.env` file:

```env
# Radar Address Validation API Keys
RADAR_TEST_SECRET=your_radar_secret_key_here
RADAR_TEST_PUBLIC=your_radar_public_key_here
```

## Server-Side Usage (Secret Key)

The secret key is used for server-side address validation during registration:

### API Endpoint
- **POST** `/api/auth/register` - Validates addresses server-side before user creation

### Example Request
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1 (555) 123-4567',
    address: {
      streetAddress: '123 Main Street',
      city: 'New York',
      stateProvince: 'NY',
      zipCode: '10001'
    },
    isAdmin: false
  })
});

const result = await response.json();
console.log('Address validation result:', result.addressValidation);
```

### Response
```json
{
  "message": "Registration successful! Please check your email to confirm your account.",
  "user": { ... },
  "addressValidation": {
    "isValid": true,
    "formattedAddress": "123 Main St, New York, NY 10001, USA",
    "confidence": "high"
  }
}
```

## Client-Side Usage (Public Key)

The public key is used for client-side address validation and autocomplete.

### 1. Get Radar Configuration

First, get the public key from your server:

```javascript
// Get Radar configuration from your API
const configResponse = await fetch('/api/auth/radar/config');
const config = await configResponse.json();

console.log('Radar public key:', config.publicKey);
```

### 2. Install Radar SDK

```bash
npm install @radar/radar-js
```

### 3. Initialize Radar SDK

```javascript
import Radar from '@radar/radar-js';

// Initialize Radar with your public key
Radar.initialize(config.publicKey);
```

### 4. Address Autocomplete

```javascript
// Address autocomplete input
const addressInput = document.getElementById('address-input');

Radar.ui.autocomplete({
  container: 'address-autocomplete',
  input: addressInput,
  onSelection: (address) => {
    console.log('Selected address:', address);
    // Update your form with the selected address
    updateAddressForm(address);
  }
});
```

### 5. Manual Address Validation

```javascript
// Validate address manually
const address = {
  street: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10001'
};

Radar.geocode(address, (err, result) => {
  if (err) {
    console.error('Address validation failed:', err);
    return;
  }
  
  console.log('Validated address:', result);
  // result.addresses contains the validated address data
});
```

### 6. Real-time Address Validation

```javascript
// Real-time validation as user types
const validateAddressInRealTime = async (addressData) => {
  try {
    const result = await Radar.geocode(addressData);
    
    if (result.addresses && result.addresses.length > 0) {
      const validatedAddress = result.addresses[0];
      
      // Show validation status to user
      showValidationStatus(validatedAddress.confidence);
      
      // Auto-populate standardized address
      if (validatedAddress.confidence === 'high') {
        updateFormWithStandardizedAddress(validatedAddress);
      }
    }
  } catch (error) {
    console.error('Real-time validation error:', error);
  }
};
```

## Complete Frontend Integration Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Address Validation Example</title>
    <script src="https://cdn.jsdelivr.net/npm/@radar/radar-js@latest/dist/radar.min.js"></script>
</head>
<body>
    <form id="registration-form">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <input type="text" id="firstName" placeholder="First Name" required>
        <input type="text" id="lastName" placeholder="Last Name" required>
        <input type="tel" id="phoneNumber" placeholder="Phone Number" required>
        
        <!-- Address fields -->
        <input type="text" id="streetAddress" placeholder="Street Address" required>
        <input type="text" id="city" placeholder="City" required>
        <input type="text" id="stateProvince" placeholder="State/Province" required>
        <input type="text" id="zipCode" placeholder="ZIP Code" required>
        
        <!-- Address validation status -->
        <div id="address-status"></div>
        
        <button type="submit">Register</button>
    </form>

    <script>
        // Initialize Radar when page loads
        async function initializeRadar() {
            try {
                const configResponse = await fetch('/api/auth/radar/config');
                const config = await configResponse.json();
                
                if (config.publicKey) {
                    Radar.initialize(config.publicKey);
                    console.log('Radar initialized successfully');
                } else {
                    console.warn('Radar public key not available');
                }
            } catch (error) {
                console.error('Failed to initialize Radar:', error);
            }
        }

        // Real-time address validation
        function setupAddressValidation() {
            const addressFields = ['streetAddress', 'city', 'stateProvince', 'zipCode'];
            let validationTimeout;

            addressFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                field.addEventListener('input', () => {
                    clearTimeout(validationTimeout);
                    validationTimeout = setTimeout(validateCurrentAddress, 500);
                });
            });
        }

        async function validateCurrentAddress() {
            const address = {
                street: document.getElementById('streetAddress').value,
                city: document.getElementById('city').value,
                state: document.getElementById('stateProvince').value,
                zipCode: document.getElementById('zipCode').value
            };

            // Only validate if all fields have some content
            if (!Object.values(address).some(value => value.trim().length < 2)) {
                try {
                    const result = await Radar.geocode(address);
                    const statusDiv = document.getElementById('address-status');
                    
                    if (result.addresses && result.addresses.length > 0) {
                        const validatedAddress = result.addresses[0];
                        statusDiv.innerHTML = `
                            <div style="color: ${validatedAddress.confidence === 'high' ? 'green' : 'orange'}">
                                Address ${validatedAddress.confidence === 'high' ? 'validated' : 'partially validated'} 
                                (${validatedAddress.confidence} confidence)
                            </div>
                        `;
                    } else {
                        statusDiv.innerHTML = '<div style="color: red">Address not found</div>';
                    }
                } catch (error) {
                    console.error('Address validation error:', error);
                }
            }
        }

        // Form submission with server-side validation
        document.getElementById('registration-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phoneNumber: document.getElementById('phoneNumber').value,
                address: {
                    streetAddress: document.getElementById('streetAddress').value,
                    city: document.getElementById('city').value,
                    stateProvince: document.getElementById('stateProvince').value,
                    zipCode: document.getElementById('zipCode').value
                },
                isAdmin: false
            };

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    alert('Registration successful! Check your email for confirmation.');
                    console.log('Address validation result:', result.addressValidation);
                } else {
                    alert(`Registration failed: ${result.message}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });

        // Initialize everything when page loads
        window.addEventListener('load', () => {
            initializeRadar();
            setupAddressValidation();
        });
    </script>
</body>
</html>
```

## Key Differences

| Key Type | Usage | Security | Features |
|----------|-------|----------|----------|
| **Secret Key** | Server-side only | High security | Full API access, user creation |
| **Public Key** | Client-side | Safe to expose | Address validation, autocomplete, geocoding |

## Security Notes

- ✅ **Public Key**: Safe to expose in client-side code
- ❌ **Secret Key**: Must never be exposed in client-side code
- 🔒 Always validate addresses server-side before saving user data
- 🛡️ Use client-side validation for UX, server-side for security
