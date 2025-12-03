import React, { useState, useEffect } from 'react';
import { db } from '../../services/api';
import { validateVehicleDatabase, ValidationError } from '../../features/vehicles/vehicleValidation';
import { VehicleDatabase } from '../../features/vehicles/vehicleTypes';

export const VehiclesImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<VehicleDatabase | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number>(0);

  useEffect(() => {
    loadVersion();
  }, []);

  const loadVersion = async () => {
    try {
      const v = await db.getVehiclesVersion();
      setCurrentVersion(v);
    } catch (e) {
      console.error('Failed to load version', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors([]);
      setPreviewData(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    const text = await file.text();
    try {
      const json = JSON.parse(text);
      const validationErrors = validateVehicleDatabase(json);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setPreviewData(null);
      } else {
        setErrors([]);
        setPreviewData(json as VehicleDatabase);
      }
    } catch (e) {
      setErrors([{ message: 'Invalid JSON syntax' }]);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;
    
    setImporting(true);
    try {
      await db.importVehicles(previewData);
      alert('Import successful!');
      loadVersion();
      setFile(null);
      setPreviewData(null);
    } catch (e) {
      console.error(e);
      alert('Import failed: ' + (e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Импорт базы техники</h1>
      
      <div className="mb-6">
        <p>Текущая версия базы: <strong>{currentVersion}</strong></p>
      </div>

      <div className="mb-6 p-4 border rounded bg-white">
        <input 
          type="file" 
          accept=".json" 
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        
        <button 
          onClick={handleValidate}
          disabled={!file}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          Проверить файл
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <h3 className="font-bold mb-2">Ошибки валидации ({errors.length}):</h3>
          <ul className="list-disc pl-5 max-h-60 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {previewData && (
        <div className="mb-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 mb-4">
            <h3 className="font-bold">Файл валиден!</h3>
            <p>Версия: {previewData.version}</p>
            <p>Количество записей: {previewData.vehicles.length}</p>
            <p>Дата обновления: {new Date(previewData.updatedAt).toLocaleString()}</p>
          </div>
          
          <button 
            onClick={handleImport}
            disabled={importing}
            className="px-6 py-3 bg-green-600 text-white rounded font-bold disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {importing ? 'Импорт...' : 'Импортировать в базу'}
          </button>
        </div>
      )}
    </div>
  );
};
