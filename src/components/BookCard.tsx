// this engages a babel macro that does cool emotion stuff (like source maps). See https://emotion.sh/docs/babel-macros
import css from "@emotion/css/macro";
// these two make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */
import React, { useContext } from "react";
import { CheapCard } from "./CheapCard";
import LazyLoad from "react-lazyload";
import { RouterContext } from "../Router";
import { IBasicBookInfo } from "../connection/LibraryQueryHooks";
import {
    getHarvesterProducedThumbnailUrl,
    getLegacyThumbnailUrl,
    getThumbnailUrl
} from "./BookDetail/ArtifactHelper";
import { FeatureLevelBar } from "./FeatureLevelBar";
import { LanguageFeatureList } from "./LanguageFeatureList";

const BookCardWidth = 140;

interface IProps {
    onBasicBookInfo: IBasicBookInfo;
    className?: string;
    // if we're showing in one row, then we'll let swiper handle the laziness, otherwise
    // we tell the card to try and be lazy itself.
    handleYourOwnLaziness: boolean;
}

export const BookCard: React.FunctionComponent<IProps> = props => {
    const router = useContext(RouterContext);
    const legacyStyleThumbnail = getLegacyThumbnailUrl(props.onBasicBookInfo);
    const thumbnailUrl = getThumbnailUrl(props.onBasicBookInfo);

    const card = (
        <CheapCard
            className={props.className}
            css={css`
                width: ${BookCardWidth}px;
            `}
            key={props.onBasicBookInfo.baseUrl}
            onClick={() => router!.pushBook(props.onBasicBookInfo.objectId)}
        >
            {/* For (39a) Lara the Yellow Ladybird I placed a file named "test-cover" in the bucket
        in order to play with how the cards can look once we have access to their actual cover images. */}
            <img
                className={"swiper-lazy"}
                css={css`
                    height: 100px;
                    object-fit: cover; //cover will crop, but fill up nicely
                    object-position: top;
                `}
                alt={"book thumbnail"}
                // NB: if you're not getting an image, e.g. in Storybook, it might be because it's not inside of a swiper,
                // but wasn't told to 'handle its own laziness'.
                src={props.handleYourOwnLaziness ? thumbnailUrl : undefined}
                data-src={thumbnailUrl}
                onError={ev => {
                    // This is unlikely to be necessary now, as we have what we think is a reliable
                    // way to know whether the harvester has created a thumbnail.
                    // And eventually all books should simply have harvester thumbnails.
                    // Keeping the fall-back just in case it occasionally helps.
                    if ((ev.target as any).src !== legacyStyleThumbnail) {
                        (ev.target as any).src = legacyStyleThumbnail;
                    } else {
                        console.log("ugh! no thumbnail in either place");
                    }
                }}
            />

            {/* I think it would look better to have a calm, light grey Bloom logo, or a book outline, or something, instead of this animated
            LOOK AT ME! spinner. */}
            {/* <div
            className={
                "swiper-lazy-preloader " +
                css`
                    margin-top: -50px;
                `
            }
        /> */}
            <FeatureLevelBar onBasicBookInfo={props.onBasicBookInfo} />
            <div
                css={css`
                    font-weight: normal;
                    padding-left: 3px;
                    max-height: 40px;
                    overflow-y: hidden;
                    margin-top: 3px;
                    margin-bottom: 0;
                    font-size: 10pt;
                `}
            >
                {props.onBasicBookInfo.title}
            </div>
            <LanguageFeatureList onBasicBookInfo={props.onBasicBookInfo} />
        </CheapCard>
    );
    /* Note, LazyLoad currently breaks strict mode. See app.tsx */
    return props.handleYourOwnLaziness ? <LazyLoad>{card}</LazyLoad> : card;
};
