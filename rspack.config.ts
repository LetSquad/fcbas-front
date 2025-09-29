import { CleanWebpackPlugin } from "clean-webpack-plugin";
import dotenv from "dotenv";
import process from "node:process";
import path from "path";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

import rspack, { CopyRspackPlugin, SwcLoaderOptions } from "@rspack/core";
import ReactRefreshPlugin from "@rspack/plugin-react-refresh";

const env = dotenv.config({
    path: process.env.WITH_MOCK === "true" ? path.resolve(__dirname, ".env.local") : path.resolve(__dirname, ".env")
});

const formattedEnv = env.parsed
    ? Object.assign({}, ...Object.entries(env.parsed).map(([key, value]) => ({ [key]: JSON.stringify(value) })))
    : {};

export const PATHS = {
    src: path.join(__dirname, "./src"),
    public: path.join(__dirname, "./public"),
    appHtml: path.join(__dirname, "./public/index.html"),
    keycloakHtml: path.join(__dirname, "./public/silent-check-sso.html"),
    dist: path.join(__dirname, "./static"),
    nodeModules: path.resolve(__dirname, "./node_modules")
};

const devOptions = (withDevServer: boolean) => ({
    static: {
        directory: PATHS.dist
    },
    port: 8883,
    client: {
        overlay: {
            warnings: false,
            errors: true
        }
    },
    historyApiFallback: true,
    open: true,
    hot: withDevServer,
    server: "http"
});

const rspack_ = (_: any, { mode }: any) => {
    const isProduction = mode === "production";
    const withDevServer = process.env.DEV_SERVER === "true";

    return {
        mode: isProduction ? "production" : "development",
        devtool: isProduction ? false : "source-map",
        context: __dirname,
        devServer: withDevServer ? devOptions(withDevServer) : false,
        target: "web",
        entry: {
            app: PATHS.src
        },
        output: {
            path: PATHS.dist,
            filename: `js/[name]-bundle.[fullhash].js`,
            publicPath: `/${process.env.BASEPATH ? `${process.env.BASEPATH}/` : ""}`
        },
        experiments: {
            topLevelAwait: true
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        name: "vendors",
                        test: /node_modules/,
                        chunks: "all",
                        enforce: true,
                        maxSize: 249_856
                    }
                }
            },
            runtimeChunk: "single",
            moduleIds: "deterministic",
            minimize: true
        },
        module: {
            rules: [
                {
                    test: /\.tsx$/,
                    exclude: [PATHS.nodeModules],
                    use: {
                        loader: "builtin:swc-loader",
                        options: {
                            jsc: {
                                parser: {
                                    syntax: "typescript",
                                    tsx: true
                                },
                                transform: {
                                    react: {
                                        runtime: "automatic",
                                        development: !isProduction,
                                        refresh: withDevServer
                                    }
                                }
                            }
                        } satisfies SwcLoaderOptions
                    },
                    type: "javascript/auto"
                },
                {
                    test: /\.ts$/,
                    exclude: [PATHS.nodeModules],
                    loader: "builtin:swc-loader",
                    options: {
                        jsc: {
                            parser: {
                                syntax: "typescript"
                            }
                        }
                    } satisfies SwcLoaderOptions,
                    type: "javascript/auto"
                },
                {
                    test: /\.scss$/,
                    exclude: [PATHS.nodeModules],
                    use: [
                        rspack.CssExtractRspackPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                import: true,
                                sourceMap: !isProduction,
                                modules: {
                                    namedExport: false,
                                    auto: true,
                                    localIdentName: isProduction ? "[hash:base64]" : "[path][name]__[local]",
                                    exportLocalsConvention: "camelCaseOnly"
                                }
                            }
                        },
                        {
                            loader: "builtin:lightningcss-loader",
                            options: {
                                targets: "chrome >= 110"
                            }
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: !isProduction,
                                api: "modern-compiler",
                                implementation: require.resolve("sass-embedded")
                            }
                        }
                    ]
                },
                {
                    test: /\.svg$/i,
                    resourceQuery: /raw/,
                    type: "asset/source"
                },
                {
                    test: /\.(png|ico|jpg|ttf|otf|eot|svg|woff(2)?)$/,
                    type: "asset/resource",
                    resourceQuery: { not: /raw/ },
                    generator: {
                        filename: "./assets/[name]-[contenthash][ext]"
                    }
                }
            ]
        },
        resolve: {
            extensions: [".js", ".jsx", ".ts", ".tsx", ".scss", ".css", ".png"],
            alias: {
                "@assets": path.resolve(__dirname, "./assets"),
                "@coreUtils": path.resolve(__dirname, "src/utils"),
                "@hooks": path.resolve(__dirname, "src/utils/hooks"),
                "@coreStyles": path.resolve(__dirname, "src/styles"),
                "@models": path.resolve(__dirname, "src/models"),
                "@components": path.resolve(__dirname, "src/components"),
                "@commonComponents": path.resolve(__dirname, "src/components/common"),
                "@pages": path.resolve(__dirname, "src/pages"),
                "@store": path.resolve(__dirname, "src/store"),
                "@api": path.resolve(__dirname, "src/api"),
                "@mocks": path.resolve(__dirname, "src/mocks")
            }
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: []
            }),
            new rspack.ProgressPlugin(),
            isProduction && new TsCheckerRspackPlugin({ typescript: { mode: "write-references" } }),
            new rspack.HtmlRspackPlugin({
                template: PATHS.appHtml,
                filename: "./index.html"
            }),
            new rspack.CssExtractRspackPlugin({
                filename: "./css/[name].css",
                chunkFilename: "./css/[name].css"
            }),
            new CopyRspackPlugin({ patterns: [{ from: PATHS.keycloakHtml }] }),
            new rspack.DefinePlugin({
                process: {
                    env: {
                        NODE_ENV: JSON.stringify(mode),
                        WITH_MOCK: JSON.stringify(process.env.WITH_MOCK),
                        ...formattedEnv,
                        VERSION:
                            formattedEnv.VERSION === '""'
                                ? JSON.stringify(process.env.npm_package_version)
                                : JSON.stringify(formattedEnv.VERSION)
                    }
                }
            }),
            withDevServer && new ReactRefreshPlugin()
        ].filter(Boolean)
    };
};
module.exports = rspack_;
