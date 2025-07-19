import { Model, ModelStatic, FindOptions, CreateOptions, UpdateOptions, DestroyOptions, Attributes } from 'sequelize';

export abstract class BaseRepository<T extends Model> {
    protected model: ModelStatic<T>;

    constructor(model: ModelStatic<T>) {
        this.model = model;
    }

    /**
     * Find a single record by ID
     */
    async findById(id: number): Promise<T | null> {
        return this.model.findByPk(id);
    }

    /**
     * Find all records matching the options
     */
    async findAll(options?: FindOptions<T>): Promise<T[]> {
        return this.model.findAll(options);
    }

    /**
     * Find one record matching the options
     */
    async findOne(options: FindOptions<T>): Promise<T | null> {
        return this.model.findOne(options);
    }

    /**
     * Create a new record
     */
    async create(data: Partial<T>, options?: CreateOptions<T>): Promise<T> {
        return this.model.create(data as any, options);
    }

    /**
     * Update records matching the options
     */
    async update(data: Partial<T>, options: UpdateOptions<T>): Promise<number> {
        const [affectedCount] = await this.model.update(data as any, options);
        return affectedCount;
    }

    /**
     * Delete records matching the options
     */
    async delete(options: DestroyOptions<T>): Promise<number> {
        return this.model.destroy(options);
    }

    /**
     * Count records matching the options
     */
    async count(options?: FindOptions<T>): Promise<number> {
        return this.model.count(options);
    }

    /**
     * Find or create a record
     */
    async findOrCreate(options: FindOptions<T> & { defaults?: Partial<Attributes<T>> }): Promise<[T, boolean]> {
        return this.model.findOrCreate(options as any);
    }

    /**
     * Get paginated results
     */
    async findPaginated(page: number = 1, limit: number = 10, options: FindOptions<T> = {}): Promise<{ data: T[]; total: number }> {
        const offset = (page - 1) * limit;
        
        const [data, total] = await Promise.all([
            this.model.findAll({
                ...options,
                offset,
                limit
            }),
            this.model.count(options)
        ]);

        return { data, total };
    }

    /**
     * Check if a record exists
     */
    async exists(options: FindOptions<T>): Promise<boolean> {
        const count = await this.model.count(options);
        console.log("BaseRepository.exists - count:", count, "options:", JSON.stringify(options));
        return count > 0;
    }

    /**
     * Bulk create records
     */
    async bulkCreate(data: Partial<T>[], options?: CreateOptions<T>): Promise<T[]> {
        return this.model.bulkCreate(data as any[], options);
    }

    /**
     * Bulk update records
     */
    async bulkUpdate(data: Partial<T>, options: UpdateOptions<T>): Promise<number> {
        const [affectedCount] = await this.model.update(data as any, options);
        return affectedCount;
    }
} 