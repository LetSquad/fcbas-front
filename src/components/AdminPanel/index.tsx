import FileSelector from "@commonComponents/FileSelector";
import Flex from "@commonComponents/Flex";
import DownloadReport from "@components/AdminPanel/DownloadReport";
import { useLazyUploadFlightsDataQuery } from "@store/flights/api";
import { useLazyUploadRegionsShapeQuery } from "@store/regions/api";

import styles from "./styles/AdminPanel.module.scss";

export default function AdminPanel() {
    const [triggerRegionsShapeUploads, regionsShapeUploadsResult] = useLazyUploadRegionsShapeQuery();
    const [triggerFlightsDataUploads, flightsDataUploadsResult] = useLazyUploadFlightsDataQuery();

    return (
        <Flex column rowGap="18px" alignItemsCenter className={styles.container}>
            <FileSelector
                onSave={(file) => triggerRegionsShapeUploads(file, false)}
                saveButtonText="Загрузить регионы"
                title="Загрузка регионов"
                subtitle="Выберите архив с shp-файлами"
                accept={{
                    "application/zip": [".zip"]
                }}
                rejectionTypesText=".zip"
                typesPlaceholderText=".zip"
                isLoading={regionsShapeUploadsResult.isLoading || flightsDataUploadsResult.isFetching}
                isError={regionsShapeUploadsResult.isError}
            />
            <FileSelector
                onSave={(file) => triggerFlightsDataUploads(file, false)}
                saveButtonText="Загрузить данные полетов"
                title="Загрузка данных с полетами БПЛА"
                subtitle="Выберите файл таблицы с данными полетов"
                accept={{
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
                }}
                rejectionTypesText=".xlsx"
                typesPlaceholderText=".xlsx"
                isLoading={flightsDataUploadsResult.isLoading || flightsDataUploadsResult.isFetching}
                isError={flightsDataUploadsResult.isError}
            />
            <DownloadReport />
        </Flex>
    );
}
