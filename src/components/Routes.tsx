// this engages a babel macro that does cool emotion stuff (like source maps). See https://emotion.sh/docs/babel-macros
import css from "@emotion/css/macro";
// these two lines make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */

import React, { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "react-router-dom";
import { GridPage } from "./Grid/GridPage"; // internally lazy
import { BulkEditPageCodeSplit } from "./BulkEdit/BulkEditPageCodeSplit";
import { BookDetailCodeSplit } from "./BookDetail/BookDetailCodeSplit";
import { ReadBookPageCodeSplit } from "./ReadBookPageCodeSplit";
import { CollectionSubsetPage } from "./CollectionSubsetPage";
import { ContentfulBanner } from "./banners/ContentfulBanner";
import { CollectionPage } from "./CollectionPage";
import { Footer } from "./Footer";
import { ContentfulPage } from "./pages/ContentfulPage";
import { ContentfulMultiPartPage } from "./pages/ContentfulMultiPartPage";
import { getDummyCollectionForPreview } from "../model/Collections";
import { ErrorBoundary } from "./ErrorBoundary";
import { IEmbedSettings } from "../model/ContentInterfaces";
import { EmbeddingHost, isEmbedded, useSetEmbeddedUrl } from "./EmbeddingHost";
import { CollectionStatsPageCodeSplit } from "./statistics/CollectionStatsPageCodeSplit";
import { TestEmbeddingPage } from "./TestEmbedding";
import { ReleaseNotes } from "./ReleaseNotes";

export let previousPathname = "";
let currentPathname = "";

// The main set of switches that loads different things into the main content area of Blorg
// based on the current window location.
export const Routes: React.FunctionComponent<{}> = () => {
    const location = useLocation();
    useSetEmbeddedUrl();
    if (currentPathname !== location.pathname) {
        previousPathname = currentPathname;
        currentPathname = location.pathname;
    }

    return (
        <ErrorBoundary url={location.pathname}>
            <Switch>
                <Route
                    path="/test-embedding/:code*"
                    render={({ match }) => {
                        return <TestEmbeddingPage code={match.params.code} />;
                    }}
                ></Route>
                {/* Alias from legacy blorg */}
                <Route path={"/browse"}>
                    <Redirect to="/create" />
                </Route>
                {/* One of the links from BloomDesktop goes here */}
                <Route path={"/books"}>
                    <Redirect to="/create" />
                </Route>
                <Route
                    path={[
                        "/downloads", // Alias for convenience when telling people where to get Bloom
                        "/installers", // Alias from legacy blorg
                    ]}
                >
                    <Redirect to="/page/create/downloads" />
                </Route>
                <Route path={"/page/create/about"}>
                    <ContentfulMultiPartPage urlKey="new-about" />
                </Route>
                <Route
                    path={[
                        "/artofreading", // We have published this link in various places (like the WeSay page)
                    ]}
                >
                    <Redirect to="/page/create/page/art-of-reading" />
                </Route>
                {/* At contentful.com, when you work on something, there is a "Preview" button
                                        which takes you to our site so you can see how your content will actually be
                                        displayed. For banners, we configured contentful to set you to this url. */}
                <Route
                    path="/_previewBanner/:id" // used by preview button when editing in contentful
                    render={({ match }) => (
                        <React.Fragment>
                            <div // simulate it being in a context that sets some margin
                                css={css`
                                    //margin: 20px;
                                    height: 500px;
                                `}
                            >
                                <ContentfulBanner
                                    id={match.params.id}
                                    collection={getDummyCollectionForPreview(
                                        match.params.id
                                    )}
                                />
                            </div>
                            <Footer />
                        </React.Fragment>
                    )}
                ></Route>
                <Route
                    path="/:breadcrumbs*/book/:id"
                    render={({ match }) => {
                        return <BookDetailCodeSplit id={match.params.id} />;
                    }}
                />
                <Route
                    path="/player/:id"
                    render={({ match }) => {
                        return <ReadBookPageCodeSplit id={match.params.id} />;
                    }}
                />
                <Route
                    path="*/release-notes/:channel"
                    render={({ match }) => {
                        return <ReleaseNotes channel={match.params.channel} />;
                    }}
                />
                <Route path="/about">
                    <ContentfulMultiPartPage urlKey="new-about" />
                </Route>
                <Route
                    path="/grid/:filter*"
                    render={({ match }) => {
                        return <GridPage filters={match.params.filter} />;
                    }}
                />
                <Route
                    path="/bulk/:filter*"
                    render={({ match }) => {
                        return (
                            <BulkEditPageCodeSplit
                                filters={match.params.filter}
                            />
                        );
                    }}
                />
                <Route
                    path="/page/:breadcrumbs*/:pageName"
                    render={({ match }) => {
                        return (
                            <ContentfulPage urlKey={match.params.pageName} />
                        );
                    }}
                />
                {/* the colon here is not literally there in the url */}
                <Route
                    path={"/:segments*/stats"}
                    render={({ match }) => {
                        if (window.self !== window.top) {
                            throw new Error(
                                "Stats not available in embedding."
                            );
                        }
                        const { collectionName } = splitPathname(
                            match.params.segments
                        );
                        return (
                            <CollectionStatsPageCodeSplit
                                collectionName={collectionName}
                            />
                        );
                    }}
                ></Route>
                <Route
                    path="/sponsorship" // From legacy blorg
                >
                    <ContentfulPage urlKey="sponsorship" />
                </Route>
                {/* Must come last, this matches anything, including the home path with nothing at all. */}
                <Route
                    path={"/:segments*"}
                    render={({ match }) => {
                        if (window.self !== window.top) {
                            return (
                                <EmbeddingHost
                                    urlSegments={location.pathname}
                                ></EmbeddingHost>
                            );
                        }
                        return (
                            <CollectionWrapper
                                segments={match.params.segments}
                            ></CollectionWrapper>
                        );
                    }}
                ></Route>
            </Switch>
        </ErrorBoundary>
    );
};

// Given a pathname like /enabling-writers/ew-nigeria/:level:1/:topic:Agriculture/:search:dogs,
// produces {collectionName: "ew-nigeria" filters: ["level:1", "topic:Agriculture", "search:dogs"],
// breadcrumbs: ["enabling-writers"]}.
// The collection name is the last segment with no leading colon.
// The filters are all the following things that do have leading colons, minus the colons.
// The breadcrumbs are the things before the collectionName (not counting an empty string before the first slash)
// Special cases:
// - pathname is undefined, or possibly empty or a single slash: happens when there's no pathname at all:
//       collectionName is root.read, others results are empty
// - everything is a filter: collectionName is root.read
// - collection works out to "read": change to "root.read"
export function splitPathname(
    pathname: string
): {
    embeddedSettingsUrlKey: string | undefined;
    collectionName: string;
    filters: string[];
    breadcrumbs: string[];
    bookId: string;
    isPlayerUrl: boolean;
    isPageUrl: boolean;
} {
    const segments = trimLeft(pathname ?? "", "/").split("/");
    let isPlayerUrl = false;
    const isPageUrl = segments[0] === "page";

    // these two variables move roughly in sync, however, firstFilterIndex
    // (if less than collection length) is always exactly the index of the
    // first thing starting with a colon (after this loop exits).
    // collectionSegmentIndex gets adjusted in various special cases, so it
    // does not always stay the index of the last segment with no colon.
    let collectionSegmentIndex = segments.length - 1;
    let firstFilterIndex = segments.length;
    while (collectionSegmentIndex >= 0) {
        if (!segments[collectionSegmentIndex].startsWith(":")) {
            break;
        }
        firstFilterIndex = collectionSegmentIndex;
        collectionSegmentIndex--;
    }
    let collectionName = segments[collectionSegmentIndex];
    let bookId = "";

    if (
        collectionSegmentIndex < 0 ||
        collectionName === "read" ||
        !collectionName
    ) {
        // all segments (if any) are filters! We're in the root collection.
        collectionName = "root.read";
    }
    if (collectionSegmentIndex >= 1) {
        const previous = segments[collectionSegmentIndex - 1];
        if (previous === "player") {
            isPlayerUrl = true;
            collectionName = ""; // we have no way of knowing it, but it's not the book ID.
            bookId = segments[collectionSegmentIndex];
            collectionSegmentIndex--; // "player" is not a breadcrumb
        }
        if (previous === "book") {
            collectionName =
                collectionSegmentIndex >= 2
                    ? segments[collectionSegmentIndex - 2]
                    : "";
            bookId = segments[collectionSegmentIndex];
            collectionSegmentIndex--; // "book" is not a breadcrumb
        }
    }

    const embeddedSettings = isEmbedded() ? "embed-" + collectionName : "";

    return {
        embeddedSettingsUrlKey: embeddedSettings,
        collectionName,
        filters: segments.slice(firstFilterIndex).map((x) => x.substring(1)),
        breadcrumbs: segments.slice(0, Math.max(collectionSegmentIndex, 0)),
        bookId,
        isPlayerUrl,
        isPageUrl,
    };
}

// what we're calling "target" is the last part of url, where the url is <breadcrumb stuff>/<target>
// Thus, it is the shortest URL that identifies the collection and filters that we want,
// without a leading slash.
// This function is called when the collection indicated by the current location pathname
// is considered to be a parent of target, so we want a URL that indicates the target collection,
// but uses the current location pathname collection as breadcrumbs.
// It's possible that it is a true child collection; for example, if current pathname is
// /enabling-writers and target is ew-nigeria, we want enabling-writers/ew-nigeria.
// It's also possible that we're moving to a filtered subset collection; for example, if
// the current pathname is /enabling-writers/ew-nigeria and target is ew-nigeria/:level:1
// We want to get enabling-writers/ew-nigeria/:level:1 (only one ew-nigeria).
// We might also be going a level of filter deeper; for example, from location
// /enabling-writers/ew-nigeria/:level:1 to target ew-nigeria/:level:1/:topic:Agriculture
// producing enabling-writers/ew-nigeria/:level:1/:topic:Agriculture.
// Any leading slash on target should be ignored.
// See https://docs.google.com/document/d/1cA9-9tMSydZ6Euo-hKmdHo_JlO0aLW8Fi9v293oIHK0/edit#heading=h.3b7gegy9uie8
// for more of the logic.
export function getUrlForTarget(target: string) {
    if (target.startsWith("http")) return target;

    const { breadcrumbs, collectionName: pathCollectionName } = splitPathname(
        window.location.pathname
    );
    let segments = [...breadcrumbs];

    const { collectionName, isPageUrl } = splitPathname(target);
    if (isPageUrl) {
        segments.push("page");
    }
    if (pathCollectionName && collectionName !== pathCollectionName) {
        segments.push(pathCollectionName);
    }
    const trimmedTarget = trimLeft(target, "/");
    if (trimmedTarget.startsWith("player/")) {
        // don't want breadcrumbs
        segments = [];
    }
    segments.push(trimmedTarget);

    if (
        segments[0] === "root.read" ||
        segments[0] === "read" ||
        segments[0] === ""
    ) {
        segments.splice(0, 1);
    }
    return segments.join("/");
}

function trimLeft(s: string, char: string) {
    return s.replace(new RegExp("^[" + char + "]+"), "");
}

export function getContextLangIso(urlKey: string) {
    return urlKey.startsWith("language:")
        ? // we don't want anything after a slash as part of the isoCode
          urlKey.substring("language:".length).split("/")[0]
        : undefined;
}

export function useSetBrowserTabTitle(title: string | undefined) {
    const location = useLocation();
    useEffect(() => {
        if (!title) {
            document.title = "Loading...";
        } else {
            // we support titles coming in from the URL to support book playback
            // (I'm not sure why that's different, but it is).
            const urlParams = new URLSearchParams(location.search);

            // urlParams.get() automatically decodes it for us.
            // Be careful not to decode it again. Applying decoding multiple times can change the result
            // (possibly generating invalid URLs), especially if the title contains '%' characters.
            const titleFromUrl = urlParams.get("title");
            setBloomLibraryTitle(titleFromUrl ? titleFromUrl : title);
        }
    }, [title, location]);
}

// This is used where we can't use useDocumentTitle, typically because
// we don't know the title until after some conditional logic prevented by
// rules of hooks.
export function setBloomLibraryTitle(title: string): void {
    document.title = "Bloom Library: " + title;
}

export const CollectionWrapper: React.FunctionComponent<{
    segments: string;
    embeddedSettings?: IEmbedSettings;
}> = (props) => {
    const { collectionName, filters } = splitPathname(props.segments);

    // This heuristic might change. Basically this is the route
    // for displaying top-level collections.
    if (filters.length === 0) {
        return (
            <CollectionPage
                embeddedSettings={props.embeddedSettings}
                collectionName={collectionName}
            />
        );
    }
    // While this one is for filtered (subset) collections, typically from 'More' or Search
    return (
        <CollectionSubsetPage
            collectionName={collectionName}
            filters={filters}
        />
    );
};
