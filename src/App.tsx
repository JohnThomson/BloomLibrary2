// this engages a babel macro that does cool emotion stuff (like source maps). See https://emotion.sh/docs/babel-macros
import css from "@emotion/css/macro";
// these two lines make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */

import React from "react";
import theme from "./theme";
import { ThemeProvider } from "@material-ui/core";
import { LoginDialog } from "./components/User/LoginDialog";
import { LocalizationProvider } from "./localization/LocalizationProvider";
import UnderConstruction from "./components/UnderConstruction";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { RouterContent } from "./model/RouterContent";
import CacheProvider from "./model/CacheProvider";
import { OSFeaturesProvider } from "./components/OSFeaturesContext";
import CssBaseline from "@material-ui/core/CssBaseline";
import ScrollToTop from "./ScrollToTop";
import { configure } from "mobx";
import { QueryParamProvider } from "use-query-params";

// Turn off "mobx" strict mode, so we can set observables without the boilerplate
// of wrapping methods annotated as 'actions'.
configure({ enforceActions: "never" });

export const App: React.FunctionComponent<{}> = (props) => {
    const embeddedMode = window.self !== window.top;

    return (
        <React.Fragment>
            <CssBaseline />
            <LocalizationProvider>
                <div
                    css={css`
                        display: flex;
                        flex-direction: column;
                        margin-left: 0;
                        height: 100%;
                        // CssBaseLine changes the default font-family from what is set in index.css,
                        // so we change it here again to what we want, which is Andika added to this
                        // list of sans-serif fonts.  (BL-11186)
                        font-family: Roboto, Noto, Andika, "Open Sans",
                            sans-serif;
                    `}
                >
                    {/* <React.StrictMode>
                In StrictMode,
                    * react-image 2.3.0 makes this complain about UNSAFE_componentWillReceiveProps
                    * react-lazyload 2.6.5 makes it complain about finDomNode
                These then make it hard to notice new errors, it can be very hard to figure
                out what component is causing the problem if you don't notice it close to the time
                that the error was introduced. So I'm disabling this for now... would be nice to
                enable it once in while and make sure no other problems have snuck in. Eventually
                the above libraries should catch up, or we could switch to ones that do.

                Note, we still wrap any sections that don't have any non-strict children in <React.StrictMode>.

                See also https://github.com/facebook/react/issues/16362
                */}
                    <ThemeProvider theme={theme}>
                        <CacheProvider>
                            <OSFeaturesProvider>
                                <UnderConstruction />
                                <Router>
                                    <QueryParamProvider
                                        ReactRouterRoute={Route}
                                    >
                                        <ScrollToTop />
                                        <RouterContent />
                                    </QueryParamProvider>
                                </Router>
                            </OSFeaturesProvider>
                        </CacheProvider>
                    </ThemeProvider>
                    {embeddedMode || <LoginDialog />}{" "}
                    {/* </React.StrictMode> */}
                </div>
            </LocalizationProvider>
        </React.Fragment>
    );
};

export default App;
