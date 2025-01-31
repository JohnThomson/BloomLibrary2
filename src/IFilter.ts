export enum BooleanOptions {
    No = "No",
    Yes = "Yes",
    All = "All",
}
export function parseBooleanOptions(value: any): BooleanOptions {
    switch (value) {
        case true:
        case "True":
        case "true":
        case "Yes":
        case "yes":
            return BooleanOptions.Yes;

        case false:
        case "False":
        case "false":
        case "No":
        case "no":
            return BooleanOptions.No;

        default:
            return BooleanOptions.All;
    }
}
export interface IFilter {
    language?: string; // review: what is this exactly? BCP 47? Our Parse has duplicate "ethnologueCode" and "isoCode" columns, which actually contain code and full script tags.
    publisher?: string;
    originalPublisher?: string;
    originalCredits?: string;
    bookshelf?: string;
    feature?: string;
    topic?: string;
    bookShelfCategory?: string;
    otherTags?: string;
    // inCirculation:undefined will be treated as InCirculationOptions.Yes
    inCirculation?: BooleanOptions;
    // false or undefined means draft books will not be returned.
    draft?: BooleanOptions;
    search?: string;
    keywordsText?: string;
    brandingProjectName?: string;

    // Derivative collections can be defined one of two ways.
    // 1) derivedFrom - a filter which defines the books you want derivatives of.
    // 2) derivedFromCollectionName - the name of a collection which contains the books you want derivatives of.
    // External definitions (such as Contentful) will prefer the latter as it will keep in sync if the parent collection definition changes.
    // But it is possible to provide the former.
    // Internally, if derivedFromCollectionName is provided, we look up the collection's filter and populate derivedFrom from that.
    // If both are set externally, derivedFromCollectionName will win.
    // See limitations on derivative collections in LibraryQueryHooks.processDerivedFrom().
    derivedFrom?: IFilter;
    derivedFromCollectionName?: string;
    edition?: string;

    // Each field above generally specifies some limitation on results returned by a Parse query.  The filter
    // defined by the combination of fields produces a set INTERSECTION of all the individual result sets.
    // (This could also be described as a logical AND operation.)  This is good for restricting the output of
    // the filter as narrowly as desired.  But what if we want a set UNION of results instead?  This field
    // provides a means to define a set of alternatives that are combined together as a set UNION.
    // NB: At the moment, there is no way to specify this on contentful.
    anyOfThese?: IFilter[];

    // BL-10865. Controls whether we include books that are marked as being exact duplicates except for branding.
    // Can be true (only rebrands), false (no rebrands), or "all", which means ignore that property.
    rebrand?: BooleanOptions;
}
