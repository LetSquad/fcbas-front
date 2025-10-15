import { useCallback, useRef, useState } from "react";
import { Toast, toast } from "react-hot-toast";

import { FormikProvider, useFormik } from "formik";
import { DateTime } from "luxon";
import { Button, Form } from "semantic-ui-react";

import axios from "@api/api";
import apiUrls from "@api/apiUrls";
import CustomWarningToast from "@commonComponents/CustomWarningToast";
import Flex from "@commonComponents/Flex";
import FormField from "@commonComponents/FormField";
import { buildExportRows } from "@components/AdminPanel/utils";
import { useKeycloak } from "@hooks/useKeycloak";
import { FormFieldType } from "@models/forms/enums";
import { RawReportResponse, ReportQueryParams } from "@models/reports/types";

import styles from "./styles/DownloadReport.module.scss";

if (process.env.WITH_MOCK) {
    await import("@mocks/report/mock").then((m) => m.setupReportMocks());
}

export default function DownloadReport() {
    const { keycloak } = useKeycloak();

    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const downloadVariantRef = useRef<"json" | "xlsx" | "pdf">(null);

    const getRawReport = useCallback(
        async (values: ReportQueryParams) => {
            if (!keycloak.token) {
                throw new Error("Token not found");
            }

            const response = await axios.get<RawReportResponse>(apiUrls.reportFlightsErp(), { params: values });

            if (!response.data) {
                throw new Error("Response is empty");
            }

            return response.data;
        },
        [keycloak.token]
    );

    const onDownloadJson = useCallback(
        async (values: ReportQueryParams) => {
            setIsError(false);
            setIsLoading(true);

            try {
                if (!keycloak.token) {
                    setIsError(true);
                    return;
                }

                const response = await axios.get<Blob>(apiUrls.reportFlights(), {
                    params: values,
                    responseType: "blob"
                });

                if (!response.data) {
                    setIsError(true);
                    return;
                }

                const href = URL.createObjectURL(response.data);

                const link = document.createElement("a");
                link.href = href;
                link.setAttribute("download", `report-${DateTime.now().toFormat("dd.MM.yyyy")}.json`); // or any other extension
                document.body.append(link);
                link.click();

                link.remove();
                URL.revokeObjectURL(href);
            } catch {
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        },
        [keycloak.token]
    );

    const onDownloadXlsx = useCallback(
        async (values: ReportQueryParams) => {
            setIsError(false);
            setIsLoading(true);
            toast.dismiss("empty-report-toast");

            try {
                const reportData = await getRawReport(values);

                if (!reportData?.flights?.length) {
                    toast.custom((t: Toast) => <CustomWarningToast text="Невозможно скачать отчет, так как он пустой" toast={t} />, {
                        id: "empty-report-toast",
                        duration: 10_000
                    });
                    return;
                }

                const xlsx = await import("xlsx");
                const worksheet = xlsx.utils.json_to_sheet(buildExportRows(reportData.flights));
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Отчет");
                const timestamp = DateTime.now().toFormat("yyyyLLdd_HHmm");
                xlsx.writeFile(workbook, `flights-report_${timestamp}.xlsx`);
            } catch (error) {
                console.error("Не удалось экспортировать отчет в XLSX", error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        },
        [getRawReport]
    );

    const onDownloadPdf = useCallback(
        async (values: ReportQueryParams) => {
            setIsError(false);
            setIsLoading(true);
            toast.dismiss("empty-report-toast");

            try {
                const reportData = await getRawReport(values);

                if (!reportData?.flights?.length) {
                    toast.custom((t: Toast) => <CustomWarningToast text="Невозможно скачать отчет, так как он пустой" toast={t} />, {
                        id: "empty-report-toast",
                        duration: 10_000
                    });
                    return;
                }

                const [{ jsPDF: JsPDF }, autoTableModule, notoSansFontModule] = await Promise.all([
                    import("jspdf"),
                    import("jspdf-autotable"),
                    import("@coreUtils/fonts/notoSansRegularBase64")
                ]);

                const fontBase64 = notoSansFontModule.NOTO_SANS_REGULAR_BASE64;

                const exportRows = buildExportRows(reportData.flights);

                if (exportRows.length === 0) {
                    toast.custom((t: Toast) => <CustomWarningToast text="Невозможно скачать отчет, так как он пустой" toast={t} />, {
                        id: "empty-report-toast",
                        duration: 10_000
                    });
                    return;
                }

                const headers = Object.keys(exportRows[0]);
                const body = exportRows.map((row) => headers.map((header) => row[header as keyof typeof row]));

                const doc = new JsPDF();
                doc.addFileToVFS(notoSansFontModule.NOTO_SANS_REGULAR_FILE_NAME, fontBase64);
                doc.addFont(notoSansFontModule.NOTO_SANS_REGULAR_FILE_NAME, notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY, "normal");
                doc.setFont(notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY);

                const autoTable = autoTableModule.default;
                autoTable(doc, {
                    head: [headers],
                    body,
                    styles: {
                        font: notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY,
                        fontStyle: "normal"
                    },
                    headStyles: {
                        font: notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY,
                        fontStyle: "normal"
                    }
                });

                const timestamp = DateTime.now().toFormat("yyyyLLdd_HHmm");
                doc.save(`flights_report_${timestamp}.pdf`);
            } catch (error) {
                console.error("Не удалось экспортировать отчет в PDF", error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        },
        [getRawReport]
    );

    const onSubmit = useCallback(
        (values: ReportQueryParams) => {
            switch (downloadVariantRef.current) {
                case "json": {
                    onDownloadJson(values);
                    break;
                }
                case "xlsx": {
                    onDownloadXlsx(values);
                    break;
                }
                case "pdf": {
                    onDownloadPdf(values);
                    break;
                }
                default: {
                    break;
                }
            }
        },
        [onDownloadJson, onDownloadPdf, onDownloadXlsx]
    );

    const formik = useFormik<ReportQueryParams>({
        onSubmit,
        initialValues: {
            startDate: DateTime.now().startOf("year").toISODate(),
            finishDate: DateTime.now().toISODate()
        }
    });

    return (
        <Flex column rowGap="10px" className={styles.container}>
            <Flex column rowGap="5px">
                <span className={styles.title}>Скачивание отчета</span>
                <span className={styles.subTitle}>Скачайте отчет о проведенных полетах</span>
            </Flex>
            <FormikProvider value={formik}>
                <Form>
                    <Flex columnGap="15px" alignItemsEnd>
                        <FormField
                            name="startDate"
                            label="Начало периода"
                            type={FormFieldType.DATEPICKER}
                            maxDate={formik.values.finishDate ? DateTime.fromISO(formik.values.finishDate).toJSDate() : undefined}
                            className={styles.field}
                        />
                        <FormField
                            name="finishDate"
                            label="Конец периода"
                            minDate={formik.values.startDate ? DateTime.fromISO(formik.values.startDate).toJSDate() : undefined}
                            maxDate={new Date()}
                            type={FormFieldType.DATEPICKER}
                            className={styles.field}
                        />
                        <Button
                            primary
                            onClick={() => {
                                downloadVariantRef.current = "pdf";
                                formik.submitForm();
                            }}
                            className={styles.button}
                            loading={isLoading}
                        >
                            Скачать отчет в PDF
                        </Button>
                        <Button
                            secondary
                            onClick={() => {
                                downloadVariantRef.current = "xlsx";
                                formik.submitForm();
                            }}
                            className={styles.button}
                            loading={isLoading}
                        >
                            Скачать отчет в XLSX
                        </Button>
                        <Button
                            onClick={() => {
                                downloadVariantRef.current = "json";
                                formik.submitForm();
                            }}
                            className={styles.button}
                            loading={isLoading}
                        >
                            Скачать отчет в JSON
                        </Button>
                    </Flex>
                </Form>
            </FormikProvider>
            {isError && <span className={styles.error}>Произошла ошибка при скачивании отчета. Попробуйте еще раз</span>}
        </Flex>
    );
}
