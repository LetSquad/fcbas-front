import { useCallback, useEffect, useMemo, useState } from "react";
import { Accept, useDropzone } from "react-dropzone";

import classNames from "classnames";
import { Button, Dimmer, Icon, Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";

import styles from "./styles/FileSelector.module.scss";

interface FileSelectorProps {
    title: string;
    subtitle: string;
    saveButtonText: string;
    onSave: (file: File) => void;
    accept: Accept;
    rejectionTypesText: string;
    typesPlaceholderText: string;
    isLoading?: boolean;
    isError?: boolean;
    isSuccess?: boolean;
}

export default function FileSelector({
    title,
    subtitle,
    saveButtonText,
    onSave,
    accept,
    rejectionTypesText,
    typesPlaceholderText,
    isLoading,
    isError,
    isSuccess
}: FileSelectorProps) {
    const [currentFile, setCurrentFile] = useState<File>();
    const [errorFile, setErrorFile] = useState<File>();

    const onDrop = useCallback(
        (_acceptedFiles: File[]) => {
            if (_acceptedFiles[0]) {
                setCurrentFile(_acceptedFiles[0]);
                if (errorFile) {
                    setErrorFile(undefined);
                }
            }
        },
        [errorFile]
    );

    const { getRootProps, getInputProps, open, fileRejections, acceptedFiles } = useDropzone({
        onDrop,
        accept,
        multiple: false,
        noClick: true,
        noKeyboard: true
    });

    const content = useMemo(() => {
        if (fileRejections.length > 0) {
            return (
                <div className={styles.dropzoneTitleContainerError}>
                    {`Файл ${fileRejections[0].file.name} не разрешен. Перетащите файл с расширением ${rejectionTypesText} или`}
                    <Button onClick={open} className={styles.dropzoneTitleLink} type="button">
                        выберите его
                    </Button>
                </div>
            );
        }

        if (currentFile) {
            return (
                <Flex column justifyCenter alignItemsCenter rowGap="10px">
                    <span className={styles.dropzoneTitleSelectedContent}>
                        {`${currentFile.name} - ${Math.round((currentFile.size / 1024 / 1024) * 100) / 100} Мб`}
                    </span>
                    <Button onClick={open} type="button">
                        Выбрать другой файл
                    </Button>
                </Flex>
            );
        }

        return (
            <>
                <Icon className={styles.iconUpload} name="cloud upload" />
                <div className={styles.dropzoneTitleContainerDefault}>
                    <div>{`Переместите файл ${typesPlaceholderText} в область или`}</div>
                    <Button onClick={open} className={styles.dropzoneTitleLink} type="button">
                        выберите его
                    </Button>
                </div>
            </>
        );
    }, [fileRejections, currentFile, typesPlaceholderText, open, rejectionTypesText]);

    useEffect(() => {
        if (isSuccess) {
            setCurrentFile(undefined);
            setErrorFile(undefined);
        }
    }, [isSuccess]);

    return (
        <Flex column rowGap="12px" className={styles.container}>
            {isLoading && (
                <Dimmer active>
                    <Loader />
                </Dimmer>
            )}
            <Flex justifySpaceBetween columnGap="10px" alignItemsEnd>
                <Flex column rowGap="5px">
                    <span className={styles.title}>{title}</span>
                    <span className={styles.subTitle}>{subtitle}</span>
                </Flex>
                <Button primary disabled={!currentFile} onClick={() => onSave(currentFile as File)}>
                    {saveButtonText}
                </Button>
            </Flex>
            {isError && <span className={styles.error}>Произошла ошибка при загрузки файла, попробуйте еще раз</span>}
            {isSuccess && <span className={styles.success}>Файл успешно загружен</span>}
            <div {...getRootProps({ className: styles.dropzoneContainer })}>
                <input {...getInputProps()} />
                <div
                    className={classNames({
                        [styles.dropzoneReject]: fileRejections.length > 0,
                        [styles.dropzoneAccept]: acceptedFiles.length > 0,
                        [styles.dropzoneDefault]: fileRejections.length === 0 && acceptedFiles.length === 0
                    })}
                >
                    {content}
                </div>
            </div>
        </Flex>
    );
}
