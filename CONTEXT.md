# Insurance

This context covers the issuance and management of commercial insurance policies for corporate customers.

## Language

**Customer**:
A company (legal entity) that holds one or more insurance policies as the policyholder.
_Avoid_: Client, account, user

**Policy**:
An insurance contract belonging to a Customer; always one of three concrete types: HealthPolicy, PropertyPolicy, or AutoPolicy.
_Avoid_: Contract, plan, coverage

**HealthPolicy**:
A Policy covering the health of a Customer's employees; characterised by a covered employee count and a coverage tier.
_Avoid_: Health plan, medical coverage

**PropertyPolicy**:
A Policy covering one real-estate asset owned by a Customer; characterised by a property address, insured value, and property type.
_Avoid_: Home insurance, real-estate policy

**AutoPolicy**:
A Policy covering a Customer's vehicle fleet; characterised by an insured vehicle count and a vehicle category.
_Avoid_: Car insurance, fleet insurance

**PolicyStatus**:
The lifecycle state of a Policy: `pending` (sold, not yet in force), `active` (currently in force), `expired` (reached end date naturally), `cancelled` (terminated early).
_Avoid_: State, lifecycle

**RegistrationNumber**:
The official company identifier issued by a national registry (e.g. KvK, Companies House, EIN); the natural business key of a Customer.
_Avoid_: Company ID, business number
