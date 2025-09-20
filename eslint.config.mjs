import { defineConfig, globalIgnores } from "eslint/config";
import { configs, plugins } from "eslint-config-airbnb-extended";
import { rules as prettierConfigRules } from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unicorn from "eslint-plugin-unicorn";

import js from "@eslint/js";

const jsConfig = [
    {
        name: "js/config",
        ...js.configs.recommended
    },
    plugins.stylistic,
    plugins.importX,
    ...configs.base.recommended
];

const reactConfig = [plugins.react, plugins.reactHooks, plugins.reactA11y, ...configs.react.recommended];

const typescriptConfig = [plugins.typescriptEslint, ...configs.base.typescript, ...configs.react.typescript];

const prettierConfig = [
    {
        name: "prettier/plugin/config",
        plugins: {
            prettier: prettierPlugin
        }
    },
    {
        name: "prettier/config",
        rules: {
            ...prettierConfigRules,
            "prettier/prettier": [
                "error",
                {
                    printWidth: 140,
                    tabWidth: 4,
                    trailingComma: "none"
                },
                {
                    usePrettierrc: false
                }
            ]
        }
    }
];

export default defineConfig([
    globalIgnores(["**/rspack.config.ts", "**/node_modules", "**/dist", "**/*.js", "**/*.jsx", "**/static", "**/public", "**/uploads"]),
    ...jsConfig,
    ...typescriptConfig,
    ...prettierConfig,
    ...reactConfig,
    unicorn.configs.recommended,
    {
        plugins: {
            "simple-import-sort": simpleImportSort
        },

        rules: {
            "no-nested-ternary": "error",
            "no-continue": "off",
            "no-console": "off",
            "max-len": "off",
            curly: ["error", "all"],
            "no-use-before-define": "off",
            "class-methods-use-this": "off",
            "no-plusplus": "off",
            "no-underscore-dangle": "off",
            "naming-convention": "off",
            "no-restricted-syntax": "off",
            "no-await-in-loop": "off",
            "consistent-return": "off",
            "operator-linebreak": "off",
            "jsx-props-no-spreading": "off",
            "no-param-reassign": [
                "error",
                {
                    props: false
                }
            ],
            "default-case": [
                "error",
                {
                    commentPattern: String.raw`^skip\sdefault$`
                }
            ],

            "import-x/first": "error",
            "import-x/newline-after-import": "error",
            "import-x/no-duplicates": "error",
            "import-x/order": "off",
            "import-x/no-import-module-exports": "off",
            "import-x/no-extraneous-dependencies": "off",
            "import-x/prefer-default-export": "off",
            "import-x/extensions": [
                "error",
                "ignorePackages",
                {
                    ts: "never",
                    tsx: "never"
                }
            ],

            "jsx-a11y/anchor-is-valid": "off",
            "jsx-a11y/label-has-associated-control": [
                "error",
                {
                    required: {
                        some: ["nesting", "id"]
                    }
                }
            ],

            "simple-import-sort/exports": "error",
            "simple-import-sort/imports": [
                "error",
                {
                    groups: [
                        [String.raw`^\u0000`],
                        ["^react"],
                        ["^@telegram-apps"],
                        [String.raw`^(\w|@reduxjs/toolkit|@react-css/flex|@fortawesome)`],
                        [String.raw`^@\w`],
                        ["^"],
                        [String.raw`^\.`]
                    ]
                }
            ],

            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
            "react/jsx-max-props-per-line": "off",
            "react/jsx-indent": "off",
            "react/jsx-indent-props": "off",
            "react/jsx-wrap-multilines": "off",
            "react/destructuring-assignment": "off",
            "react/display-name": "off",
            "react/require-default-props": "off",
            "react/jsx-props-no-spreading": "off",
            "react/function-component-definition": [
                2,
                {
                    namedComponents: ["function-declaration", "arrow-function"]
                }
            ],
            "react/jsx-filename-extension": [
                1,
                {
                    extensions: [".tsx"]
                }
            ],

            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            "unicorn/filename-case": "off",
            "unicorn/prevent-abbreviations": "off",
            "unicorn/no-null": "off",
            "unicorn/no-useless-undefined": "off",
            "unicorn/prefer-node-protocol": "off",
            "unicorn/no-unreadable-array-destructuring": "off",
            "unicorn/prefer-export-from": "off",
            "unicorn/prefer-module": "off",
            "unicorn/prefer-top-level-await": "off",

            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/indent": "off",
            "@typescript-eslint/quotes": "off",
            "@typescript-eslint/comma-dangle": "off",
            "@typescript-eslint/no-use-before-define": "off",
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "variable",
                    format: ["camelCase", "UPPER_CASE", "PascalCase"],
                    leadingUnderscore: "allow",
                    trailingUnderscore: "allow"
                },
                {
                    selector: "function",
                    format: ["PascalCase", "camelCase"],
                    leadingUnderscore: "allow",
                    trailingUnderscore: "allow"
                },
                {
                    selector: "import",
                    format: ["PascalCase", "camelCase"]
                },
                {
                    selector: "enumMember",
                    format: ["UPPER_CASE"]
                },
                {
                    selector: "property",
                    format: null
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"]
                },
                {
                    selector: "accessor",
                    format: ["PascalCase"]
                },
                {
                    selector: "default",
                    format: ["camelCase"],
                    leadingUnderscore: "allow",
                    trailingUnderscore: "allow"
                }
            ]
        }
    }
]);
