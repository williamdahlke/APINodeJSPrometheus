export function isValidJson(json: any): boolean {
    if (typeof json !== 'object' || json === null) {
      return false;
    }
    try {
      JSON.stringify(json);
      return true;
    } catch (e) {
      return false;
    }
  }