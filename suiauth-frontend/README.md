# SuiAuth: Decentralized Identity and Authentication Solution

![SuiAuth Logo](https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo1.png)

SuiAuth is a decentralized identity and authentication solution built on the Sui blockchain for the Sui Overflow 2025 Hackathon (Cryptography Track). It leverages zkLogin to provide secure, privacy-preserving authentication for dApps, offering a seamless OAuth-based login experience while maintaining the security and privacy features of blockchain technology.

## 🔍 Overview

SuiAuth bridges the gap between traditional Web2 login systems and Web3 applications by:

- **Enabling OAuth Authentication**: Users can authenticate using familiar providers like Google, Facebook, and more
- **Leveraging zkLogin**: Utilizing Sui's zkLogin for cryptographic verification without exposing private keys
- **Managing Digital Identity**: Creating on-chain identity objects that users fully control
- **Supporting Programmable Permissions**: Fine-grained access control for connected applications
- **Providing Credential Management**: Store and selectively disclose credentials and attestations
- **Offering Recovery Options**: Secure account recovery mechanisms

## 🚀 Features

- **zkLogin Integration**: Seamless authentication with Google, Facebook, and more
- **On-Chain Identity**: Secure, user-controlled identity storage
- **Programmable Permissions**: Grant and revoke specific access to applications
- **Credential Management**: Store verifiable credentials with selective disclosure
- **Recovery System**: Multi-factor recovery options
- **Developer SDK**: Easy integration for dApp developers

## 🔧 Technology Stack

- **Frontend**: Next.js, React, TanStack Query, Tailwind CSS
- **Blockchain**: Sui Network
- **Smart Contracts**: Move programming language
- **Authentication**: zkLogin, OAuth 2.0
- **Wallet Integration**: @mysten/dapp-kit

## 🏗️ Architecture

SuiAuth consists of three main components:

1. **Smart Contracts (Move)**: On-chain logic for identity management, permissions, and credentials
2. **Frontend Application**: User interface for managing identity, permissions, and credentials
3. **Developer SDK**: Integration toolkit for dApp developers

## 🖥️ Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Sui CLI
- Google OAuth credentials for development

### Installation

```bash
# Clone the repository
git clone https://github.com/gboigwe/suiauth.git
cd suiauth/suiauth-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration values

# Start the development server
npm run dev
```

### Smart Contract Deployment

```bash
# Navigate to the Move package
cd ../contracts

# Build the Move package
sui move build

# Publish the package to Sui testnet
sui client publish --gas-budget 100000000
```

## 🔒 Security

SuiAuth prioritizes security through:

- Zero-knowledge proofs for authentication
- No private key exposure
- Secure credential storage
- Security audits (planned)

## 🛣️ Roadmap

- [x] Initial zkLogin integration
- [x] Basic identity management
- [ ] Permission management system
- [ ] Credential storage and verification
- [ ] Recovery mechanisms
- [ ] Developer SDK and documentation
- [ ] Mainnet deployment

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the supervision of the Sui Overflow 2025 Hackathon License - see the LICENSE file for details.

## 🏆 Sui Overflow 2025 Hackathon

This project is being developed as part of the Sui Overflow 2025 Hackathon under the Cryptography Track. It leverages Sui's zkLogin and cryptographic primitives to create a secure, privacy-preserving authentication solution.

## 📞 Contact

For questions or feedback, please open an issue or contact the team at [geakande@gmail.com].
