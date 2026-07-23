export const getMyPetsApi = async () => {

    const response = await api.get(
        "/api/pets"
    );

    return response;

};