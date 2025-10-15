import { useCallback, useState } from "react";

import axios from "@api/api";
import apiUrls from "@api/apiUrls";
import FileSelector from "@commonComponents/FileSelector";
import Flex from "@commonComponents/Flex";
import DownloadReport from "@components/AdminPanel/DownloadReport";
import { useKeycloak } from "@hooks/useKeycloak";

import styles from "./styles/AdminPanel.module.scss";

export default function AdminPanel() {
    const { keycloak } = useKeycloak();

    const [isRegionsShapeUploading, setIsRegionsShapeUploading] = useState(false);
    const [isFlightsDataUploading, setIsFlightsDataUploading] = useState(false);

    const [isRegionsShapeUploadError, setIsRegionsShapeUploadError] = useState(false);
    const [isFlightsDataUploadError, setIsFlightsDataUploadError] = useState(false);

    const [isRegionsShapeUploadSuccess, setIsRegionsShapeUploadSuccess] = useState(false);
    const [isFlightsDataUploadSuccess, setIsFlightsDataUploadSuccess] = useState(false);

    const onRegionsShapeUpload = useCallback(
        async (file: File) => {
            setIsRegionsShapeUploading(true);
            setIsRegionsShapeUploadError(false);
            setIsRegionsShapeUploadSuccess(false);

            try {
                const formData = new FormData();
                formData.append("zip", file);

                if (!keycloak.token) {
                    setIsRegionsShapeUploadError(true);
                    return;
                }

                await axios.post(apiUrls.regionShape(), formData, {
                    headers: {
                        "Content-Disposition": file.name,
                        "Content-Type": "multipart/form-data"
                    }
                });

                setIsRegionsShapeUploadSuccess(true);
            } catch {
                setIsRegionsShapeUploadError(true);
            } finally {
                setIsRegionsShapeUploading(false);
            }
        },
        [keycloak.token]
    );

    const onFlightsDataUpload = useCallback(
        async (file: File) => {
            setIsFlightsDataUploading(true);
            setIsFlightsDataUploadError(false);
            setIsFlightsDataUploadSuccess(false);

            try {
                const formData = new FormData();
                formData.append("data", file);

                if (!keycloak.token) {
                    setIsFlightsDataUploadError(true);
                    return;
                }

                await axios.post(apiUrls.flightData(), formData, {
                    headers: {
                        "Content-Disposition": file.name,
                        "Content-Type": "multipart/form-data"
                    }
                });

                setIsFlightsDataUploadSuccess(true);
            } catch {
                setIsFlightsDataUploadError(true);
            } finally {
                setIsFlightsDataUploading(false);
            }
        },
        [keycloak.token]
    );

    return (
        <Flex column rowGap="18px" alignItemsCenter className={styles.container}>
            <FileSelector
                onSave={onRegionsShapeUpload}
                saveButtonText="Загрузить регионы"
                title="Загрузка регионов"
                subtitle="Выберите архив с shp-файлами"
                accept={{
                    "application/zip": [".zip"]
                }}
                rejectionTypesText=".zip"
                typesPlaceholderText=".zip"
                isLoading={isRegionsShapeUploading}
                isError={isRegionsShapeUploadError}
                isSuccess={isRegionsShapeUploadSuccess}
            />
            <FileSelector
                onSave={onFlightsDataUpload}
                saveButtonText="Загрузить данные полетов"
                title="Загрузка данных с полетами БПЛА"
                subtitle="Выберите файл таблицы с данными полетов"
                accept={{
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
                }}
                rejectionTypesText=".xlsx"
                typesPlaceholderText=".xlsx"
                isLoading={isFlightsDataUploading}
                isError={isFlightsDataUploadError}
                isSuccess={isFlightsDataUploadSuccess}
            />
            <DownloadReport />
        </Flex>
    );
}
