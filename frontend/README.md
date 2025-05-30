# Project README

## File Structure Overview

```plaintext
src/
├── app/                      # Application-wide setup
│   ├── App.tsx
│   ├── index.tsx
│   ├── providers/            # Context providers, app-level utilities
│   └── routes/               # Routes configuration
│
├── entities/                 # Reusable business domain entities
│   ├── user/
│   │   ├── components/
│   │   │   ├── UserCard.tsx
│   │   │   ├── UserList.tsx
│   │   ├── model/
│   │   │   ├── user.types.ts
│   │   │   ├── user.api.ts
│   │   └── index.ts
│   └── subscription/
│       ├── components/
│       ├── model/
│       └── index.ts
│
├── features/                 # UI + logic to implement a specific feature
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── model/
│   │   │   ├── auth.slice.ts
│   │   │   ├── auth.hooks.ts
│   │   └── index.ts
│   └── subscription-management/
│       ├── components/
│       ├── model/
│       └── index.ts
│
├── pages/                    # Application views (UI layer)
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   └── Home.tsx
│
├── shared/                   # Shared utilities and components
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   ├── lib/
│   │   ├── axios.ts
│   │   └── form-validators.ts
│   ├── styles/
│   │   ├── global.css
│   │   └── theme.css
│   └── index.ts
└── widgets/                  # Composed components integrating multiple features
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

## Design Principles

This project follows a **feature-sliced design (FSD)** architecture, which emphasizes modularity and scalability. Below are the guidelines for organizing files and adding new components or features.

---

## Folder Descriptions and Usage

### `app/`

- **Purpose**: Contains application-wide configurations like routing, context providers, and initialization logic.
- **Usage**:
  - Add global providers (e.g., `ThemeProvider`, `ReduxProvider`) to `providers/`.
  - Update routing logic in `routes/` when adding or removing pages.

---

### `entities/`

- **Purpose**: Represents reusable, business-level entities (e.g., User, Subscription).
- **Usage**:
  - Add reusable components for entities in `components/`.
  - Define API calls, types, or logic in `model/`.
  - Always export your entity from the `index.ts` file.

---

### `features/`

- **Purpose**: Combines UI and business logic for a specific feature (e.g., authentication, subscription management).
- **Usage**:
  - Add components specific to the feature in `components/`.
  - Manage Redux slices, hooks, or logic in `model/`.
  - Group all feature-specific code for better encapsulation.

---

### `pages/`

- **Purpose**: Represents the main application views or screens (e.g., Dashboard, Profile).
- **Usage**:
  - Use components from `features/` and `entities/` to build complete views.
  - Each page should focus on layout and structure, delegating logic to `features/` or `entities/`.

---

### `shared/`

- **Purpose**: Houses shared utilities, generic components, and styles.
- **Usage**:
  - Add reusable components like buttons, modals, or form elements to `components/`.
  - Place utility functions and third-party configurations in `lib/`.
  - Manage global styles or themes in `styles/`.

---

### `widgets/`

- **Purpose**: Contains composed components that integrate multiple features (e.g., Header, Footer).
- **Usage**:
  - Use this folder for components that are shared across pages but integrate logic from various `features/`.

---

## Development Guidelines

1. **Adding a New Feature**

   - Create a folder in `features/` for the new feature.
   - Include subfolders for `components/`, `model/`, and `index.ts`.
   - Use `model/` for Redux slices, API logic, or custom hooks related to the feature.

2. **Creating a New Entity**

   - Create a folder under `entities/`.
   - Define reusable components in `components/`.
   - Place domain-specific logic like types and API calls in `model/`.

3. **Modifying UI Pages**

   - Update or create files in `pages/`.
   - Use existing `widgets/`, `entities/`, and `features/` to avoid duplicating code.

4. **Maintaining Consistency**

   - Follow naming conventions and group code logically.
   - Document any new logic or structure in the respective folder's `README.md`.

5. **Collaboration**
   - Adhere to this structure when working on new features or fixing bugs.
   - Communicate changes in structure or dependencies during team meetings.

---

By adhering to this structure, all developers and interns can collaborate effectively, ensuring a clean and scalable codebase.

---
## Notes

- This structure is **only an example** and should be adapted based on project requirements.
- Ensure all code is documented and follows established coding standards.
- Use version control effectively to track changes and maintain code quality.


