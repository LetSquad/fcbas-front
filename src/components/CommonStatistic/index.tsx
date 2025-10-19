import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { DateTime } from "luxon";
import { Button } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import { useExtendedMode } from "@components/App/context";
import Blocks from "@components/CommonStatistic/Blocks";
import FlightDensityDiagram from "@components/CommonStatistic/Charts/FlightDensityDiagram";
import TimeOfDayFlightsDiagram from "@components/CommonStatistic/Charts/TimeOfDayFlightsDiagram";
import TopAverageDurationFlightsDiagram from "@components/CommonStatistic/Charts/TopAverageDurationFlightsDiagram";
import TopDirectionsFlightsDiagram from "@components/CommonStatistic/Charts/TopDirectionsFlightsDiagram";
import TopFlightsDiagram from "@components/CommonStatistic/Charts/TopFlightsDiagram";
import TopOperatorsFlightsDiagram from "@components/CommonStatistic/Charts/TopOperatorsFlightsDiagram";
import TrendDiagram from "@components/CommonStatistic/Charts/TrendDiagram";
import { ChartExportRegistration, ChartsExportContext } from "@components/CommonStatistic/context";
import { OperatorType } from "@models/analytics/enums";

import styles from "./styles/CommonStatistic.module.scss";

const EXPORT_ERROR_TOAST_ID = "dashboard-charts-export-error";
const EXPORT_EMPTY_TOAST_ID = "dashboard-charts-export-empty";

async function blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener("loadend", () => {
            resolve(reader.result as string);
        });

        reader.addEventListener("error", () => {
            reject(reader.error);
        });

        reader.readAsDataURL(blob);
    });
}

export default function CommonStatistic() {
    const { isExtendedMode } = useExtendedMode();

    const [registeredCharts, setRegisteredCharts] = useState<Map<string, ChartExportRegistration>>(() => new Map());
    const [isExporting, setIsExporting] = useState(false);

    const registerChart = useCallback((chart: ChartExportRegistration) => {
        setRegisteredCharts((prev) => {
            const next = new Map(prev);
            next.set(chart.id, chart);

            return next;
        });

        return () => {
            setRegisteredCharts((prev) => {
                const next = new Map(prev);
                next.delete(chart.id);

                return next;
            });
        };
    }, []);

    const chartsExportContextValue = useMemo(
        () => ({
            registerChart
        }),
        [registerChart]
    );

    const availableChartsCount = useMemo(
        () => [...registeredCharts.values()].filter((chart) => !chart.isDownloadDisabled).length,
        [registeredCharts]
    );

    const handleExportPdf = useCallback(async () => {
        if (isExporting) {
            return;
        }

        const charts = [...registeredCharts.values()].filter((chart) => !chart.isDownloadDisabled);

        if (charts.length === 0) {
            toast.dismiss(EXPORT_EMPTY_TOAST_ID);
            toast.error("Нет доступных графиков для выгрузки.", {
                id: EXPORT_EMPTY_TOAST_ID,
                duration: 5e3
            });

            return;
        }

        toast.dismiss(EXPORT_ERROR_TOAST_ID);
        setIsExporting(true);

        try {
            const [{ jsPDF: JsPDF }, notoSansFontModule] = await Promise.all([
                import("jspdf"),
                import("@coreUtils/fonts/notoSansRegularBase64")
            ]);

            const doc = new JsPDF({
                orientation: "landscape"
            });

            doc.addFileToVFS(notoSansFontModule.NOTO_SANS_REGULAR_FILE_NAME, notoSansFontModule.NOTO_SANS_REGULAR_BASE64);
            doc.addFont(notoSansFontModule.NOTO_SANS_REGULAR_FILE_NAME, notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY, "normal");
            doc.setFont(notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY);

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const horizontalMargin = 30;
            const topMargin = 40;
            const bottomMargin = 30;
            const titleFontSize = 16;
            const imageTopOffset = topMargin + titleFontSize + 6;

            for (const [index, chart] of charts.entries()) {
                if (index > 0) {
                    doc.addPage();
                    doc.setFont(notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY);
                }

                const chartBlob = await chart.getImage();

                if (!chartBlob) {
                    throw new Error(`Не удалось подготовить изображение для графика «${chart.title}».`);
                }

                const dataUrl = await blobToDataUrl(chartBlob);

                doc.setFontSize(titleFontSize);
                doc.text(chart.title, horizontalMargin, topMargin);

                const availableWidth = pageWidth - horizontalMargin * 2;
                const availableHeight = pageHeight - imageTopOffset - bottomMargin;

                doc.addImage(dataUrl, "PNG", horizontalMargin, imageTopOffset, availableWidth, availableHeight, undefined, "FAST");
            }

            const timestamp = DateTime.now().toFormat("yyyyLLdd_HHmm");
            doc.save(`dashboard-charts_${timestamp}.pdf`);
        } catch (error) {
            console.error("Не удалось экспортировать графики в PDF", error);

            toast.error("Не удалось экспортировать графики в PDF. Попробуйте позже.", {
                id: EXPORT_ERROR_TOAST_ID,
                duration: 1e4
            });
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, registeredCharts]);

    const isExportDisabled = isExporting || availableChartsCount === 0;

    return (
        <ChartsExportContext.Provider value={chartsExportContextValue}>
            <Flex column height100 width100 rowGap="8px" className={styles.container}>
                {isExtendedMode && (
                    <Flex justifyEnd>
                        <Button
                            icon="file pdf"
                            content="Выгрузить все графики в PDF"
                            primary
                            onClick={handleExportPdf}
                            loading={isExporting}
                            disabled={isExportDisabled}
                            className={styles.button}
                        />
                    </Flex>
                )}
                <Flex height100 width100 gap="12px" wrap style={{ flex: 1 }}>
                    {isExtendedMode && <Blocks />}
                    <TrendDiagram />
                    <TopFlightsDiagram />
                    <TopOperatorsFlightsDiagram operatorType={OperatorType.UL} />
                    {isExtendedMode && <TopOperatorsFlightsDiagram operatorType={OperatorType.FL} />}
                    {isExtendedMode && <TimeOfDayFlightsDiagram />}
                    <TopAverageDurationFlightsDiagram />
                    {isExtendedMode && <TopDirectionsFlightsDiagram />}
                    {isExtendedMode && <FlightDensityDiagram />}
                </Flex>
            </Flex>
        </ChartsExportContext.Provider>
    );
}
