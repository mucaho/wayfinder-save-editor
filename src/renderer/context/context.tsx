import {
  useState,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useContext,
} from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  ENCODE_FILE,
  ENCODE_META_FILE,
  ipcChannels,
} from '@/src/config/ipc-channels';
import { SaveData } from '../saveFileTypes';

type Structure = { [key: string]: any };

type InitialValue = {
  decodedFile?: Structure;
  saveStructure: SaveData;
  fileName?: string;
  assetsPath?: string;
  saveDecodedStructure: ({
    fileMetadata,
    decodedSave,
    saveStructure,
  }: any) => void;
  saveNewValues: (newSaveData: SaveData) => void;
};

const initialValue: InitialValue = {
  decodedFile: {},
  saveStructure: {} as SaveData,
  fileName: '',
  saveDecodedStructure: () => {},
  saveNewValues: () => {},
};

export const SaveEditorContext = createContext(initialValue);

export const SaveEditorProvider = ({ children }: any) => {
  const { toast } = useToast();
  const [fileMetadata, saveFileMetadata] = useState<any>();
  const [decodedFile, setDecodedFile] = useState<Structure>();
  const [saveStructure, setSaveStructure] = useState<SaveData>({} as SaveData);
  const [assetsPath, setAssetsPath] = useState('');

  const saveDecodedStructure = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    ({ fileMetadata, decodedSave, saveStructure }: any) => {
      saveFileMetadata(fileMetadata);
      setDecodedFile(decodedSave);
      setSaveStructure(saveStructure);
    },
    [setDecodedFile, setSaveStructure],
  );

  const saveNewValues = useCallback(
    (newSaveData: SaveData) => {
      window.electron.ipcRenderer.sendMessage(
        ENCODE_FILE,
        fileMetadata,
        decodedFile,
        newSaveData,
      );

      window.electron.ipcRenderer.once(ENCODE_FILE, (responseCode) => {
        if (responseCode === 200)
          toast({
            title: 'Save File Updated!',
          });
        else
          toast({
            variant: 'destructive',
            title: 'Failed to update the Save File',
          });
      });

      setSaveStructure(newSaveData);
    },
    [fileMetadata, decodedFile, toast],
  );

  const saveNewMetaValues = useCallback(
    (newSaveData: SaveData) => {
      window.electron.ipcRenderer.sendMessage(
        ENCODE_META_FILE,
        fileMetadata,
        decodedFile,
        newSaveData,
      );

      window.electron.ipcRenderer.once(ENCODE_META_FILE, (responseCode) => {
        if (responseCode === 200)
          toast({
            title: 'Save File Updated!',
          });
        else
          toast({
            variant: 'destructive',
            title: 'Failed to update the Save File',
          });
      });

      setSaveStructure(newSaveData);
    },
    [fileMetadata, decodedFile, toast],
  );

  useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return
    window.electron.ipcRenderer
      .invoke(ipcChannels.GET_ASSETS_PATH)
      .then(setAssetsPath);
  }, []);

  const value = useMemo(
    () => ({
      saveDecodedStructure,
      saveNewValues,
      saveNewMetaValues,
      decodedFile,
      saveStructure,
      assetsPath,
      fileName: fileMetadata?.name,
    }),
    [
      saveDecodedStructure,
      saveNewValues,
      saveNewMetaValues,
      decodedFile,
      saveStructure,
      assetsPath,
      fileMetadata?.name,
    ],
  );

  return (
    <SaveEditorContext.Provider value={value}>
      {children}
    </SaveEditorContext.Provider>
  );
};

export const useSaveContext = () => {
  const context = useContext(SaveEditorContext);
  return context;
};
