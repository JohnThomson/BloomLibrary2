import { parseBooleanOptions } from "../IFilter";
import {
    IBanner,
    IMedia,
    ICollection,
    IEmbedSettings,
} from "./ContentInterfaces";

/* The aim is to keep knowledge of Contentful limited to this file, to the extent
that we think it is worth it. Meanwhile, rest of the code can use generic structures.
This makes the rest of the code a bit simpler to understand, type-safe, and cheaper
to change to a different system in the future. */

export function convertContentfulBannerToIBanner(fields: any): IBanner {
    const b: IBanner = { ...fields };
    b.backgroundImage = convertContentfulMediaToIMedia(fields.backgroundImage);
    b.logo = convertContentfulMediaToIMedia(fields.logo);
    return b;
}

export function convertContentfulCollectionToICollection(
    item: any
): ICollection {
    // if (!fields || !item.fields.urlKey) {
    //     return undefined;
    // }
    let bannerId = item.fields.banner?.sys?.id;
    if (!bannerId) {
        if (item.fields.urlKey.startsWith("language:")) {
            bannerId = "7v95c68TL9uJBe4pP5KTN0"; // also in makeLanguageCollection
        } else if (item.fields.urlKey.startsWith("topic:")) {
            bannerId = "7E1IHa5mYvLLSToJYh5vfW"; // also in makeTopicCollection
        } else {
            bannerId = "Qm03fkNd1PWGX3KGxaZ2v";
        }
    }
    const icon = convertContentfulMediaToIMedia(
        item.fields?.iconForCardAndDefaultBanner
    );
    const sponsorshipImage = convertContentfulMediaToIMedia(
        item.fields?.sponsorshipImage
    );
    // Internally, we need tags to be named "otherTags" in the filter.
    // This is awkward as an external API name from contentful. So let's just allow "tag",
    // which matches the name on this field in the UI we present to the librarian & staff.
    // Here we rename "tag" to "otherTags"
    if (item.fields.filter?.tag) {
        item.fields.filter.otherTags = item.fields.filter.tag;
        delete item.fields.filter.tag;
    }

    const result: ICollection = {
        contentfulId: item.sys.id as string,
        urlKey: item.fields.urlKey as string,
        // By the time we get to displaying a page from this collection, this will be either the localized label or a template based on it
        title: "",
        //  We could eventually make this a field in Contentful. It's just for google and other search engines.
        metaDescription: `Free books from our ${item.fields.label} collection.`,
        label: item.fields.label,
        richTextLabel: item.fields.richTextLabel,
        description: item.fields.description,
        urlForBloomPubBundle: item.fields.urlForBloomPubBundle,
        urlForBloomSourceBundle: item.fields.urlForBloomSourceBundle,
        filter: item.fields.filter,
        statisticsQuerySpec: item.fields.statisticsQuerySpec,
        iconForCardAndDefaultBanner: icon,
        sponsorshipImage: sponsorshipImage,
        hideLabelOnCardAndDefaultBanner:
            item.fields.hideLabelOnCardAndDefaultBanner,
        kind: item.fields.kind,
        childCollections: getSubCollections(item.fields.childCollections),
        bannerId,
        layout: item.fields.layout?.fields?.name || "by-topic",
        rawLayout: item.fields.layout?.fields?.name,
        rows: item.fields.rows,
        order: item.fields.bookSortOrder,
        type: item.fields.urlKey.startsWith("http")
            ? "link"
            : item.sys.contentType.sys.id,
        expandChildCollectionRows: item.fields.expandChildCollectionRows,
        showBookCountInRowDisplay: item.fields.showBookCountInRowDisplay,
        country: item.fields.country,
    };

    // Migrate or Strip out sort orders that this version does not understand, returning the collection to default ordering,
    // so that future versions can be tested on alpha more easily. This won't help if we already had a non-default
    // ordering and are testing with a new one. In that case, we'll have to stick with "preview" or just test
    // the new ordering on other collections.
    switch (result.order) {
        case "newest-first":
            result.order = "-createdAt";
            break;
        case "-createdAt": // I can't actually search this field in contentful, but I don't think we actually have this. But it would be ok, so I'm letting it through.
            break;
        default:
            result.order = undefined;
    }

    if (item.fields.filter && item.fields.filter.rebrand !== undefined) {
        // having an item.fields.filter does mean there is a result.filter but TS can't tell, hence the "!"
        result.filter!.rebrand = parseBooleanOptions(
            item.fields.filter.rebrand
        );
    }
    if (!result.filter && item.fields.useSimpleBookshelfFilter) {
        // many collections just need to bring in all the books that Bloom uploading process has given the tag "bookshelf: blah",
        // when the Bloom Collection settings have pointed to that bookshelf. Without this default, we have to add an explicit
        // filter for each of these in the Contentful collection record.
        result.filter = { otherTags: "bookshelf:" + result.urlKey };
    }
    return result;
}

interface IContentfulMedia {
    fields: {
        title: string; // localized will be something like this: { [key: string]: string };
        description: string; // localized will be something like this: { [key: string]: string };
        file: {
            //[key: string]: {
            // localized will be something like this: { [key: string]: {... file fields}
            fileName: string;
            contentType: string;
            upload?: string;
            url?: string;
            //};
        };
    };
}
export function convertContentfulMediaToIMedia(
    media: IContentfulMedia
): IMedia | undefined {
    if (!media) return undefined;
    const a: IMedia = { url: "", credits: "", altText: "" };

    if (media?.fields?.description) {
        const parts = (media.fields.description as string).split("Credits:");
        a.credits = (parts[1] ?? "").trim();
        a.altText = parts[0].trim();
    }
    a.url = media.fields.file.url || "";
    return a;
}
interface IContentfulEmbeddingSettings {
    fields: {
        urlKey: string; // localized will be something like this: { [key: string]: string };
        enabled: boolean;
        //domain: string;
        collection: { fields: { urlKey: string } };
    };
}
export function convertContentfulEmbeddingSettingsToIEmbedSettings(
    settings: IContentfulEmbeddingSettings
): IEmbedSettings {
    return {
        urlKey: settings.fields.urlKey || "",
        enabled: settings.fields.enabled || false,
        collectionUrlKey: settings.fields.collection.fields.urlKey,
    };
}

function getSubCollections(childCollections: any[]): ICollection[] {
    if (!childCollections) {
        return [];
    }
    // The final map here is a kludge to convince typescript that filtering out
    // the undefined elements yields a collection without any undefineds.
    return (
        childCollections
            .map((x: any) => {
                // if a collection is linked to but isn't "published" yet (or has been unpublished)
                // then it doesn't have a fields property. Just skip it.
                return x && x.fields
                    ? convertContentfulCollectionToICollection(x)
                    : undefined;
            })
            .filter((y) => y)
            //.filter((y) => y)
            .map((z) => z!)
    );
}
