export interface ExpenseCategory {
    category_id: number;
    category_name: string;
    category_color: string;
    created_at: Date;
}

export interface CreateCategoryDTO {
    category_name: string;
    category_color: string;
}

export interface UpdateCategoryDTO {
    category_name?: string;
    category_color?: string;
} 