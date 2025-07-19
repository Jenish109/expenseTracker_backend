export interface ExpenseCategory {
    category_id: number;
    category_name: string;
    category_color: string;
    user_id: number;
    is_default: boolean;
    created_at: Date;
}

export interface CreateCategoryDTO {
    categoryName: string;
    categoryColor: string;
    user_id: number;
}

export interface UpdateCategoryDTO {
    categoryName?: string;
    categoryColor?: string;
} 