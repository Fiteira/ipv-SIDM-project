function normalizeData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(normalizeData).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    } else if (data !== null && typeof data === "object") {
        const sortedKeys = Object.keys(data).sort();
        const normalizedObject: any = {};
        for (const key of sortedKeys) {
            const value = data[key];
            normalizedObject[key] = typeof value === "string"
                ? value.trim().toLowerCase() // Normalizar strings
                : value instanceof Date
                    ? value.toISOString() // Normalizar datas
                    : normalizeData(value); // Normalizar objetos ou arrays internos
        }
        return normalizedObject;
    }
    return data;
}

export function compareJSON(localData: any, cloudData: any): boolean {
    const normalizedLocalData = normalizeData(localData);
    const normalizedCloudData = normalizeData(cloudData);
    return JSON.stringify(normalizedLocalData) === JSON.stringify(normalizedCloudData);
}