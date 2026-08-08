# Table-per-type inheritance for policies

Three concrete policy types (Health, Property, Auto) share a common set of columns but diverge on type-specific fields. We store shared fields in a `policies` table and type-specific fields in `health_policies`, `property_policies`, and `auto_policies` tables, each joined to `policies` by primary key.

This was chosen over single-table inheritance (one wide, sparse `policies` table with nullable type-specific columns) and JSONB (a `metadata jsonb` column on `policies`) because TPT allows per-type NOT NULL constraints, keeps the schema self-documenting, and avoids null-heavy or schemaless rows. The trade-off is a JOIN per query instead of a single table scan, which is acceptable given the low row counts per customer.
