import { BaseQueryFn } from "@reduxjs/toolkit/query/react";
import axiosObj, { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig } from "axios";
import MockAdapter from "axios-mock-adapter";

import { keycloak } from "@coreUtils/keycloak";
import { ErrorResponse } from "@models/api/types";

const normalAxios = axiosObj.create();
export const mockAxios = axiosObj.create();

const axios = process.env.WITH_MOCK ? mockAxios : normalAxios;

const applyAuthInterceptor = (instance: AxiosInstance) => {
    instance.interceptors.request.use((config) => {
        const { token } = keycloak;

        if (!token) {
            return config;
        }

        const headers = config.headers instanceof AxiosHeaders ? config.headers : AxiosHeaders.from(config.headers ?? {});

        if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        config.headers = headers;
        return config;
    });
    instance.defaults.withCredentials = true;
};

applyAuthInterceptor(normalAxios);
applyAuthInterceptor(mockAxios);

export default axios;

export const mock = new MockAdapter(mockAxios, {
    delayResponse: 1000,
    onNoMatch: "passthrough"
});

export const axiosBaseQuery =
    ({ baseUrl = "" } = {}): BaseQueryFn<
        {
            url: string;
            method?: AxiosRequestConfig["method"];
            data?: AxiosRequestConfig["data"];
            params?: AxiosRequestConfig["params"];
            headers?: AxiosRequestConfig["headers"];
            responseType?: AxiosRequestConfig["responseType"];
        },
        unknown,
        ErrorResponse
    > =>
    async ({ url, method = "get", data, params, headers, responseType }, { signal }) => {
        try {
            const result = await axios({
                url: baseUrl + url,
                method,
                data,
                params,
                headers,
                responseType,
                signal
            });

            return { data: result.data };
        } catch (axiosError) {
            if (axiosObj.isCancel(axiosError)) {
                throw axiosError;
            }

            let errorData: ErrorResponse;

            if (axiosObj.isAxiosError(axiosError)) {
                const typedError = axiosError as AxiosError<ErrorResponse>;

                if (typedError.code === "ERR_CANCELED") {
                    throw axiosError;
                }

                errorData = typedError.response?.data || {
                    code: "UNKNOWN",
                    message: "Response is empty"
                };
            } else {
                errorData = {
                    code: "UNKNOWN",
                    message: axiosError instanceof Error ? axiosError.message : "Unknown error"
                };
            }

            return { error: errorData };
        }
    };
