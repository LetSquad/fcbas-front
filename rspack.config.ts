import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";
import dotenv from "dotenv";
import process from "node:process";
import path from "path";
import { BrotliOptions, constants as zlibConstants } from "zlib";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

import rspack, { CopyRspackPlugin, SwcLoaderOptions } from "@rspack/core";
import ReactRefreshPlugin from "@rspack/plugin-react-refresh";

class Http2PushManifestPlugin {
    private readonly filename: string;

    constructor(options: { filename?: string } = {}) {
        this.filename = options.filename ?? "push-manifest.json";
    }

    apply(compiler: any) {
        compiler.hooks.thisCompilation.tap("Http2PushManifestPlugin", (compilation: any) => {
            compilation.hooks.processAssets.tap(
                {
                    name: "Http2PushManifestPlugin",
                    stage: rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
                },
                () => {
                    const manifest: Record<string | number, string[]> = {};

                    for (const chunk of compilation.chunks) {
                        if (!chunk) {
                            continue;
                        }

                        const chunkName = chunk.name ?? chunk.id;
                        if (!chunkName) {
                            continue;
                        }

                        const files = (Array.from(chunk.files ?? []) as string[]).filter((file) =>
                            /\.(css|js|woff2?|svg)$/i.test(file)
                        );

                        if (files.length) {
                            manifest[chunkName] = files.map((file) => `/${file}`);
                        }
                    }

                    const source = JSON.stringify(manifest, null, 2);
                    compilation.emitAsset(this.filename, new rspack.sources.RawSource(source));
                }
            );
        });
    }
}

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
    const brotliCompressionOptions: BrotliOptions = {
        params: {
            [zlibConstants.BROTLI_PARAM_QUALITY]: 11
        }
    };

    const compressionPlugins = isProduction
        ? [
            new CompressionPlugin({
                test: /\.(js|css|svg|json|html|woff2?)$/i,
                threshold: 10_240,
                minRatio: 0.8
            }),
            new CompressionPlugin({
                filename: "[path][base].br",
                algorithm: "brotliCompress",
                compressionOptions: brotliCompressionOptions,
                test: /\.(js|css|svg|json|html|woff2?)$/i,
                threshold: 10_240,
                minRatio: 0.8
            })
        ]
        : [];

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
                chunks: "all",
                minSize: 20_000,
                maxInitialRequests: 25,
                cacheGroups: {
                    vendors: {
                        name: "vendors",
                        test: /[\\/]node_modules[\\/]/,
                        chunks: "all",
                        enforce: true,
                        priority: 40
                    },
                    flightsMap: {
                        name: "flights-map",
                        test: /[\\/]src[\\/]components[\\/]FlightsMap[\\/]/,
                        chunks: "all",
                        reuseExistingChunk: true,
                        priority: 30,
                        enforce: true
                    },
                    analyticsTables: {
                        name: "analytics-tables",
                        test: /[\\/]src[\\/]components[\\/].*Table[\\/]/,
                        chunks: "all",
                        reuseExistingChunk: true,
                        priority: 20
                    },
                    adminArea: {
                        name: "admin-area",
                        test: /[\\/]src[\\/]pages[\\/]Admin[\\/]|[\\/]src[\\/]components[\\/]Admin[\\/]/,
                        chunks: "all",
                        reuseExistingChunk: true,
                        priority: 10
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
            ...compressionPlugins,
            isProduction && new Http2PushManifestPlugin(),
            withDevServer && new ReactRefreshPlugin()
        ].filter(Boolean)
    };
};
module.exports = rspack_;
