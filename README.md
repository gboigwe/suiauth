# SuiAuth: Decentralized Identity & Authentication Solution

SuiAuth is a decentralized identity and authentication solution built on Sui blockchain that leverages zkLogin to provide secure, privacy-preserving authentication for dApps. It enables users to authenticate with familiar OAuth providers while maintaining privacy and security on-chain.

## 🔐 Features

- **zkLogin Integration**: Seamless authentication using zkLogin and OAuth providers
- **Programmable Permissions**: Fine-grained access control for dApps
- **Recoverable Identity**: Multiple recovery options for identity security
- **Credential Management**: Store and manage verifiable credentials
- **Privacy-Preserving KYC**: Selective disclosure of identity information
- **dApp SDK**: Easy integration for developers

## 📋 Project Structure

The project is structured into two main components:

### 1. Smart Contracts (Move)

- **Identity Registry**: Core identity management
- **Permission Manager**: Handle application permissions
- **Credential Store**: Manage verifiable credentials
- **Recovery Module**: Implement recovery mechanisms
- **Attestation Module**: Handle identity attestations

### 2. Frontend Application

- **Authentication Flow**: UI for zkLogin integration
- **Dashboard**: Identity and permission management
- **SDK**: Developer integration toolkit

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Sui CLI
- Rust (for Move development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/suiauth.git
cd suiauth
```

2. Install dependencies for the frontend:
```bash
cd frontend
npm install
```

3. Build the Move contracts:
```bash
cd contracts
sui move build
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start the development server:
```bash
cd frontend
npm run dev
```

## 🔧 Usage

### For Users

1. Visit the SuiAuth portal
2. Connect with your preferred OAuth provider
3. Manage your identity and permissions

### For Developers

```typescript
// Initialize SuiAuth in your dApp
import { SuiAuth } from '@suiauth/sdk';

const suiAuth = new SuiAuth({
  appId: 'your-app-id',
  network: 'mainnet',
  requiredScopes: ['profile', 'transactions']
});

// Authenticate a user
const authResult = await suiAuth.authenticate();
if (authResult.success) {
  const { address, permissions } = authResult;
  // User is authenticated, proceed with your dApp
}
```

## 📦 Packages

- `@suiauth/contracts`: Move smart contracts
- `@suiauth/sdk`: JavaScript SDK for dApp integration
- `@suiauth/react`: React components for easy integration

## 🛣️ Roadmap

- [x] Core Identity Registry
- [x] Basic zkLogin Integration
- [x] Permission Management
- [ ] Credential System
- [ ] Recovery Mechanisms
- [ ] Advanced Attestations
- [ ] Mobile SDK

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Sui Foundation for the zkLogin implementation
- The Move and Sui developer community
- All contributors to this project
