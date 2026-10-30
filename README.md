# Expense React Client

A modern React-based frontend application for managing group expenses and payments. Built with React 19, Redux Toolkit, and Vite for a fast and scalable user experience.

## Overview

The Expense React Client is a comprehensive web application that allows users to:

- Create and manage expense groups
- Track shared expenses
- Manage user roles and permissions (RBAC)
- Process payments and settlements
- Authenticate securely with Google OAuth
- Subscribe to premium features
- Maintain user profiles

## Technology Stack

- **Frontend Framework**: React 19.2.0
- **State Management**: Redux Toolkit & React-Redux
- **Routing**: React Router DOM v7
- **Styling**: Bootstrap 5 & React Bootstrap
- **Build Tool**: Vite
- **Authentication**: Google OAuth (@react-oauth/google)
- **HTTP Client**: Axios
- **Code Quality**: ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── addExpenseModal.jsx
│   ├── AppLayout.jsx
│   ├── ExpenseCard.jsx
│   ├── GroupCard.jsx
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── settlementSummary.jsx
│   └── errors/
│       └── UnauthorizedAccess.jsx
├── pages/               # Page components
│   ├── Dashboard.jsx
│   ├── Groups.jsx
│   ├── GroupExpense.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── ManagePayments.jsx
│   ├── ManageUsers.jsx
│   ├── ManageSubscription.jsx
│   ├── ForgotPassword.jsx
│   └── Examples/        # Example/Practice pages
├── rbac/                # Role-Based Access Control
│   ├── ProtectedRoute.jsx
│   └── userPermissions.js
├── redux/               # Redux store configuration
│   └── user/
│       ├── action.js
│       └── reducer.js
├── config/
│   └── appConfig.js     # App configuration
├── services/            # API communication (via Redux)
├── styles/
│   └── custom.css
├── App.jsx
├── main.jsx
└── store.js             # Redux store setup
```

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or higher)
- npm or yarn
- Backend server running (see [expense-server README](../expense-server/README.md))

### Installation

1. Navigate to the project directory:

```bash
cd expense-react-client
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (if needed):
   Create a `.env.local` file with necessary configuration:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Build

Build the application for production:

```bash
npm run build
```

### Preview

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## Key Features

### Authentication & Authorization

- Google OAuth integration for secure login
- Role-Based Access Control (RBAC)
- Protected routes with permission checks
- User session management via Redux

### Expense Management

- Create, view, and manage group expenses
- Add expenses with category tracking
- Track who paid and who owes
- Real-time expense updates

### Group Management

- Create and manage expense groups
- Add/remove users from groups
- Assign roles and permissions
- View group statistics

### Payment Management

- Track pending payments
- Process settlements
- Payment history and records
- Multiple payment methods support

### User Management

- User profile management
- Subscription management
- Permission assignment
- User activity tracking

## Key Components

### Layout Components

- **AppLayout**: Main layout wrapper for the application
- **UserHeader/UserFooter**: Navigation and footer for user pages
- **Header/Footer**: General header and footer components

### Modals

- **addExpenseModal**: Modal for adding new expenses
- **CreateGroupModal**: Modal for creating new groups

### Cards

- **ExpenseCard**: Display individual expenses
- **GroupCard**: Display group information

### RBAC

- **ProtectedRoute**: Wrapper for routes requiring specific permissions
- **can.jsx**: Permission checking utility

## Redux State Management

The application uses Redux Toolkit for state management:

```
store/
├── user/
│   ├── userSlice (or reducer.js)
│   └── userActions (or action.js)
```

Current slices handle:

- User authentication state
- User permissions and roles
- User profile information

## API Integration

The application communicates with the backend server using Axios. All API calls are typically made through Redux actions.

Base URL: Configured in `config/appConfig.js`

## Routing

The application uses React Router v7 for navigation between pages:

- `/` - Home page
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Main dashboard
- `/groups` - Groups management
- `/group/:id/expenses` - Group expense details
- `/payments` - Payment management
- `/manage-users` - User management
- `/manage-subscription` - Subscription settings
- `/forgot-password` - Password recovery

Protected routes require authentication and appropriate permissions.

## Styling

The application uses:

- **Bootstrap 5** for responsive design
- **React Bootstrap** components for UI elements
- **Custom CSS** in `styles/custom.css` for application-specific styling

## Development Workflow

1. Create components in the `components/` directory
2. Create pages in the `pages/` directory
3. Update Redux slices in `redux/` for state changes
4. Add new routes in `App.jsx`
5. Use `ProtectedRoute` for routes requiring authentication
6. Run linting with `npm run lint`
7. Test in development with `npm run dev`

## Common Issues

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port.

### Google OAuth Not Working

Ensure your Google Client ID is correctly configured and the redirect URI is whitelisted in Google Cloud Console.

### API Connection Issues

Verify that the backend server is running and the API base URL is correctly configured.

## Performance Optimization

- Code splitting with React Router
- Lazy loading of routes
- Redux for efficient state management
- Vite's optimized build output

## Contributing

1. Follow the existing code structure and naming conventions
2. Run `npm run lint` before committing
3. Write meaningful commit messages
4. Test changes thoroughly before submitting

## License

[Add your license information here]

## Support

For issues or questions:

- Check the [backend documentation](../expense-server/README.md)
- Review the existing components and pages for examples
- Check browser console for error messages

## Future Enhancements

- [ ] Offline mode support
- [ ] Mobile app version
- [ ] Advanced reporting and analytics
- [ ] Real-time notifications
- [ ] Payment method integrations
- [ ] Multi-currency support
