# §11.5 Typing references

The base format does not type references. A profile or schema MAY constrain
what a given field's reference must point to (e.g. "`author` MUST reference
a record of type `person`"). Such constraints are validated by the schema
layer, not by this section. The reference *value* carries no type marker;
the field carries the expectation.
