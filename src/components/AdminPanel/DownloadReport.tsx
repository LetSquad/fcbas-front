import { useCallback, useState } from "react";

import { FormikProvider, useFormik } from "formik";
import { DateTime } from "luxon";
import { Button, Dimmer, Form, Loader } from "semantic-ui-react";

import axios from "@api/api";
import apiUrls from "@api/apiUrls";
import Flex from "@commonComponents/Flex";
import FormField from "@commonComponents/FormField";
import { useKeycloak } from "@hooks/useKeycloak";
import { FormFieldType } from "@models/forms/enums";
import { ReportQueryParams } from "@models/reports/types";

import styles from "./styles/DownloadReport.module.scss";

export default function DownloadReport() {
    const { keycloak } = useKeycloak();

    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const onDownload = useCallback(
        async (values: ReportQueryParams) => {
            setIsError(false);
            setIsLoading(true);

            try {
                const response = await axios.get<Blob>(apiUrls.reportFlights(), {
                    params: values,
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`
                    }
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
            }
        },
        [keycloak.token]
    );

    const formik = useFormik<ReportQueryParams>({
        onSubmit: onDownload,
        initialValues: {
            startDate: DateTime.now().startOf("year").toISODate(),
            finishDate: DateTime.now().toISODate()
        }
    });

    return (
        <Flex column rowGap="10px" className={styles.container}>
            {isLoading && (
                <Dimmer active>
                    <Loader />
                </Dimmer>
            )}
            <Flex column rowGap="5px">
                <span className={styles.title}>Скачивание отчета</span>
                <span className={styles.subTitle}>Скачайте отчет о проведенных полетах</span>
            </Flex>
            <FormikProvider value={formik}>
                <Form>
                    <Flex columnGap="15px" alignItemsCenter>
                        <FormField
                            name="startDate"
                            label="Начало периода"
                            type={FormFieldType.DATEPICKER}
                            maxDate={formik.values.finishDate ? DateTime.fromISO(formik.values.finishDate).toJSDate() : undefined}
                        />
                        <FormField
                            name="finishDate"
                            label="Конец периода"
                            minDate={formik.values.startDate ? DateTime.fromISO(formik.values.startDate).toJSDate() : undefined}
                            maxDate={new Date()}
                            type={FormFieldType.DATEPICKER}
                        />
                        <Button primary onClick={formik.submitForm} className={styles.button}>
                            Скачать отчет
                        </Button>
                    </Flex>
                </Form>
            </FormikProvider>
            {isError && <span className={styles.error}>Произошла ошибка при скачивании отчета. Попробуйте еще раз</span>}
        </Flex>
    );
}
