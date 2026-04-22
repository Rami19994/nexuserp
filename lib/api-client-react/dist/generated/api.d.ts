import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AdjustBody, AuthUser, BomItem, CreateBomItemBody, CreateLocationBody, CreateMaterialBody, CreateProductBody, CreateUserBody, DashboardStats, ErrorResponse, HealthStatus, InventoryBalance, InventoryBalanceDetail, ListInventoryBalancesParams, ListTransactionsParams, Location, LoginBody, ManufacturingPlanRequest, ManufacturingPlanResult, Material, Product, ProductWithBom, StockInBody, TransactionDetail, TransferBody, TransferResult, UpdateMaterialBody, UpdateUserBody, User } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Login with username and password
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginBody: LoginBody, options?: RequestInit) => Promise<AuthUser>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginBody>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Login with username and password
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
/**
 * @summary Logout current user
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<void>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Logout current user
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Get current logged-in user
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<AuthUser>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current logged-in user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all users
 */
export declare const getListUsersUrl: () => string;
export declare const listUsers: (options?: RequestInit) => Promise<User[]>;
export declare const getListUsersQueryKey: () => readonly ["/api/users"];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List all users
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new user
 */
export declare const getCreateUserUrl: () => string;
export declare const createUser: (createUserBody: CreateUserBody, options?: RequestInit) => Promise<User>;
export declare const getCreateUserMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserBody>;
}, TContext>;
export type CreateUserMutationResult = NonNullable<Awaited<ReturnType<typeof createUser>>>;
export type CreateUserMutationBody = BodyType<CreateUserBody>;
export type CreateUserMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Create a new user
 */
export declare const useCreateUser: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserBody>;
}, TContext>;
/**
 * @summary Get user by ID
 */
export declare const getGetUserUrl: (id: number) => string;
export declare const getUser: (id: number, options?: RequestInit) => Promise<User>;
export declare const getGetUserQueryKey: (id: number) => readonly [`/api/users/${number}`];
export declare const getGetUserQueryOptions: <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type GetUserQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get user by ID
 */
export declare function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update user
 */
export declare const getUpdateUserUrl: (id: number) => string;
export declare const updateUser: (id: number, updateUserBody: UpdateUserBody, options?: RequestInit) => Promise<User>;
export declare const getUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserBody>;
}, TContext>;
export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>;
export type UpdateUserMutationBody = BodyType<UpdateUserBody>;
export type UpdateUserMutationError = ErrorType<unknown>;
/**
 * @summary Update user
 */
export declare const useUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserBody>;
}, TContext>;
/**
 * @summary Delete user
 */
export declare const getDeleteUserUrl: (id: number) => string;
export declare const deleteUser: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
export type DeleteUserMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUser>>>;
export type DeleteUserMutationError = ErrorType<unknown>;
/**
 * @summary Delete user
 */
export declare const useDeleteUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all materials
 */
export declare const getListMaterialsUrl: () => string;
export declare const listMaterials: (options?: RequestInit) => Promise<Material[]>;
export declare const getListMaterialsQueryKey: () => readonly ["/api/materials"];
export declare const getListMaterialsQueryOptions: <TData = Awaited<ReturnType<typeof listMaterials>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMaterials>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMaterials>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMaterialsQueryResult = NonNullable<Awaited<ReturnType<typeof listMaterials>>>;
export type ListMaterialsQueryError = ErrorType<unknown>;
/**
 * @summary List all materials
 */
export declare function useListMaterials<TData = Awaited<ReturnType<typeof listMaterials>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMaterials>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new material
 */
export declare const getCreateMaterialUrl: () => string;
export declare const createMaterial: (createMaterialBody: CreateMaterialBody, options?: RequestInit) => Promise<Material>;
export declare const getCreateMaterialMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMaterial>>, TError, {
        data: BodyType<CreateMaterialBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createMaterial>>, TError, {
    data: BodyType<CreateMaterialBody>;
}, TContext>;
export type CreateMaterialMutationResult = NonNullable<Awaited<ReturnType<typeof createMaterial>>>;
export type CreateMaterialMutationBody = BodyType<CreateMaterialBody>;
export type CreateMaterialMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Create a new material
 */
export declare const useCreateMaterial: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMaterial>>, TError, {
        data: BodyType<CreateMaterialBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createMaterial>>, TError, {
    data: BodyType<CreateMaterialBody>;
}, TContext>;
/**
 * @summary Update material
 */
export declare const getUpdateMaterialUrl: (id: number) => string;
export declare const updateMaterial: (id: number, updateMaterialBody: UpdateMaterialBody, options?: RequestInit) => Promise<Material>;
export declare const getUpdateMaterialMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMaterial>>, TError, {
        id: number;
        data: BodyType<UpdateMaterialBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMaterial>>, TError, {
    id: number;
    data: BodyType<UpdateMaterialBody>;
}, TContext>;
export type UpdateMaterialMutationResult = NonNullable<Awaited<ReturnType<typeof updateMaterial>>>;
export type UpdateMaterialMutationBody = BodyType<UpdateMaterialBody>;
export type UpdateMaterialMutationError = ErrorType<unknown>;
/**
 * @summary Update material
 */
export declare const useUpdateMaterial: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMaterial>>, TError, {
        id: number;
        data: BodyType<UpdateMaterialBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMaterial>>, TError, {
    id: number;
    data: BodyType<UpdateMaterialBody>;
}, TContext>;
/**
 * @summary Delete material
 */
export declare const getDeleteMaterialUrl: (id: number) => string;
export declare const deleteMaterial: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteMaterialMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMaterial>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteMaterial>>, TError, {
    id: number;
}, TContext>;
export type DeleteMaterialMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMaterial>>>;
export type DeleteMaterialMutationError = ErrorType<unknown>;
/**
 * @summary Delete material
 */
export declare const useDeleteMaterial: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMaterial>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteMaterial>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all locations
 */
export declare const getListLocationsUrl: () => string;
export declare const listLocations: (options?: RequestInit) => Promise<Location[]>;
export declare const getListLocationsQueryKey: () => readonly ["/api/locations"];
export declare const getListLocationsQueryOptions: <TData = Awaited<ReturnType<typeof listLocations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLocationsQueryResult = NonNullable<Awaited<ReturnType<typeof listLocations>>>;
export type ListLocationsQueryError = ErrorType<unknown>;
/**
 * @summary List all locations
 */
export declare function useListLocations<TData = Awaited<ReturnType<typeof listLocations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new location
 */
export declare const getCreateLocationUrl: () => string;
export declare const createLocation: (createLocationBody: CreateLocationBody, options?: RequestInit) => Promise<Location>;
export declare const getCreateLocationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLocation>>, TError, {
        data: BodyType<CreateLocationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createLocation>>, TError, {
    data: BodyType<CreateLocationBody>;
}, TContext>;
export type CreateLocationMutationResult = NonNullable<Awaited<ReturnType<typeof createLocation>>>;
export type CreateLocationMutationBody = BodyType<CreateLocationBody>;
export type CreateLocationMutationError = ErrorType<unknown>;
/**
 * @summary Create a new location
 */
export declare const useCreateLocation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLocation>>, TError, {
        data: BodyType<CreateLocationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createLocation>>, TError, {
    data: BodyType<CreateLocationBody>;
}, TContext>;
/**
 * @summary Delete location
 */
export declare const getDeleteLocationUrl: (id: number) => string;
export declare const deleteLocation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteLocationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLocation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteLocation>>, TError, {
    id: number;
}, TContext>;
export type DeleteLocationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteLocation>>>;
export type DeleteLocationMutationError = ErrorType<unknown>;
/**
 * @summary Delete location
 */
export declare const useDeleteLocation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLocation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteLocation>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all products
 */
export declare const getListProductsUrl: () => string;
export declare const listProducts: (options?: RequestInit) => Promise<Product[]>;
export declare const getListProductsQueryKey: () => readonly ["/api/products"];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
/**
 * @summary List all products
 */
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new product
 */
export declare const getCreateProductUrl: () => string;
export declare const createProduct: (createProductBody: CreateProductBody, options?: RequestInit) => Promise<Product>;
export declare const getCreateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductBody>;
}, TContext>;
export type CreateProductMutationResult = NonNullable<Awaited<ReturnType<typeof createProduct>>>;
export type CreateProductMutationBody = BodyType<CreateProductBody>;
export type CreateProductMutationError = ErrorType<unknown>;
/**
 * @summary Create a new product
 */
export declare const useCreateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductBody>;
}, TContext>;
/**
 * @summary Get product with BOM
 */
export declare const getGetProductUrl: (id: number) => string;
export declare const getProduct: (id: number, options?: RequestInit) => Promise<ProductWithBom>;
export declare const getGetProductQueryKey: (id: number) => readonly [`/api/products/${number}`];
export declare const getGetProductQueryOptions: <TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductQueryResult = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
export type GetProductQueryError = ErrorType<unknown>;
/**
 * @summary Get product with BOM
 */
export declare function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete product
 */
export declare const getDeleteProductUrl: (id: number) => string;
export declare const deleteProduct: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export type DeleteProductMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProduct>>>;
export type DeleteProductMutationError = ErrorType<unknown>;
/**
 * @summary Delete product
 */
export declare const useDeleteProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Add BOM item to product
 */
export declare const getAddBomItemUrl: (id: number) => string;
export declare const addBomItem: (id: number, createBomItemBody: CreateBomItemBody, options?: RequestInit) => Promise<BomItem>;
export declare const getAddBomItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addBomItem>>, TError, {
        id: number;
        data: BodyType<CreateBomItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addBomItem>>, TError, {
    id: number;
    data: BodyType<CreateBomItemBody>;
}, TContext>;
export type AddBomItemMutationResult = NonNullable<Awaited<ReturnType<typeof addBomItem>>>;
export type AddBomItemMutationBody = BodyType<CreateBomItemBody>;
export type AddBomItemMutationError = ErrorType<unknown>;
/**
 * @summary Add BOM item to product
 */
export declare const useAddBomItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addBomItem>>, TError, {
        id: number;
        data: BodyType<CreateBomItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addBomItem>>, TError, {
    id: number;
    data: BodyType<CreateBomItemBody>;
}, TContext>;
/**
 * @summary Delete BOM item
 */
export declare const getDeleteBomItemUrl: (id: number, bomId: number) => string;
export declare const deleteBomItem: (id: number, bomId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteBomItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBomItem>>, TError, {
        id: number;
        bomId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteBomItem>>, TError, {
    id: number;
    bomId: number;
}, TContext>;
export type DeleteBomItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBomItem>>>;
export type DeleteBomItemMutationError = ErrorType<unknown>;
/**
 * @summary Delete BOM item
 */
export declare const useDeleteBomItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBomItem>>, TError, {
        id: number;
        bomId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteBomItem>>, TError, {
    id: number;
    bomId: number;
}, TContext>;
/**
 * @summary Calculate manufacturing plan (BOM explosion)
 */
export declare const getCalculateManufacturingPlanUrl: () => string;
export declare const calculateManufacturingPlan: (manufacturingPlanRequest: ManufacturingPlanRequest, options?: RequestInit) => Promise<ManufacturingPlanResult>;
export declare const getCalculateManufacturingPlanMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof calculateManufacturingPlan>>, TError, {
        data: BodyType<ManufacturingPlanRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof calculateManufacturingPlan>>, TError, {
    data: BodyType<ManufacturingPlanRequest>;
}, TContext>;
export type CalculateManufacturingPlanMutationResult = NonNullable<Awaited<ReturnType<typeof calculateManufacturingPlan>>>;
export type CalculateManufacturingPlanMutationBody = BodyType<ManufacturingPlanRequest>;
export type CalculateManufacturingPlanMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Calculate manufacturing plan (BOM explosion)
 */
export declare const useCalculateManufacturingPlan: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof calculateManufacturingPlan>>, TError, {
        data: BodyType<ManufacturingPlanRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof calculateManufacturingPlan>>, TError, {
    data: BodyType<ManufacturingPlanRequest>;
}, TContext>;
/**
 * @summary Add stock to a location
 */
export declare const getStockInUrl: () => string;
export declare const stockIn: (stockInBody: StockInBody, options?: RequestInit) => Promise<InventoryBalance>;
export declare const getStockInMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof stockIn>>, TError, {
        data: BodyType<StockInBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof stockIn>>, TError, {
    data: BodyType<StockInBody>;
}, TContext>;
export type StockInMutationResult = NonNullable<Awaited<ReturnType<typeof stockIn>>>;
export type StockInMutationBody = BodyType<StockInBody>;
export type StockInMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Add stock to a location
 */
export declare const useStockIn: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof stockIn>>, TError, {
        data: BodyType<StockInBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof stockIn>>, TError, {
    data: BodyType<StockInBody>;
}, TContext>;
/**
 * @summary List inventory balances (optionally filtered)
 */
export declare const getListInventoryBalancesUrl: (params?: ListInventoryBalancesParams) => string;
export declare const listInventoryBalances: (params?: ListInventoryBalancesParams, options?: RequestInit) => Promise<InventoryBalanceDetail[]>;
export declare const getListInventoryBalancesQueryKey: (params?: ListInventoryBalancesParams) => readonly ["/api/inventory/balances", ...ListInventoryBalancesParams[]];
export declare const getListInventoryBalancesQueryOptions: <TData = Awaited<ReturnType<typeof listInventoryBalances>>, TError = ErrorType<unknown>>(params?: ListInventoryBalancesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventoryBalances>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInventoryBalances>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListInventoryBalancesQueryResult = NonNullable<Awaited<ReturnType<typeof listInventoryBalances>>>;
export type ListInventoryBalancesQueryError = ErrorType<unknown>;
/**
 * @summary List inventory balances (optionally filtered)
 */
export declare function useListInventoryBalances<TData = Awaited<ReturnType<typeof listInventoryBalances>>, TError = ErrorType<unknown>>(params?: ListInventoryBalancesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventoryBalances>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Transfer stock between locations
 */
export declare const getTransferStockUrl: () => string;
export declare const transferStock: (transferBody: TransferBody, options?: RequestInit) => Promise<TransferResult>;
export declare const getTransferStockMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof transferStock>>, TError, {
        data: BodyType<TransferBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof transferStock>>, TError, {
    data: BodyType<TransferBody>;
}, TContext>;
export type TransferStockMutationResult = NonNullable<Awaited<ReturnType<typeof transferStock>>>;
export type TransferStockMutationBody = BodyType<TransferBody>;
export type TransferStockMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Transfer stock between locations
 */
export declare const useTransferStock: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof transferStock>>, TError, {
        data: BodyType<TransferBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof transferStock>>, TError, {
    data: BodyType<TransferBody>;
}, TContext>;
/**
 * @summary Adjust inventory (stock audit/count)
 */
export declare const getAdjustInventoryUrl: () => string;
export declare const adjustInventory: (adjustBody: AdjustBody, options?: RequestInit) => Promise<InventoryBalance>;
export declare const getAdjustInventoryMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adjustInventory>>, TError, {
        data: BodyType<AdjustBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adjustInventory>>, TError, {
    data: BodyType<AdjustBody>;
}, TContext>;
export type AdjustInventoryMutationResult = NonNullable<Awaited<ReturnType<typeof adjustInventory>>>;
export type AdjustInventoryMutationBody = BodyType<AdjustBody>;
export type AdjustInventoryMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Adjust inventory (stock audit/count)
 */
export declare const useAdjustInventory: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adjustInventory>>, TError, {
        data: BodyType<AdjustBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adjustInventory>>, TError, {
    data: BodyType<AdjustBody>;
}, TContext>;
/**
 * @summary List inventory transactions with filters
 */
export declare const getListTransactionsUrl: (params?: ListTransactionsParams) => string;
export declare const listTransactions: (params?: ListTransactionsParams, options?: RequestInit) => Promise<TransactionDetail[]>;
export declare const getListTransactionsQueryKey: (params?: ListTransactionsParams) => readonly ["/api/transactions", ...ListTransactionsParams[]];
export declare const getListTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof listTransactions>>, TError = ErrorType<unknown>>(params?: ListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof listTransactions>>>;
export type ListTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary List inventory transactions with filters
 */
export declare function useListTransactions<TData = Awaited<ReturnType<typeof listTransactions>>, TError = ErrorType<unknown>>(params?: ListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get dashboard statistics
 */
export declare const getGetDashboardStatsUrl: () => string;
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/dashboard/stats"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map