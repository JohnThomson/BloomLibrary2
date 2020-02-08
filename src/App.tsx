import React from "react";

import { BrowseView } from "./components/BrowseView";
import theme from "./theme";
import { ThemeProvider } from "@material-ui/core";
import { LoginDialog } from "./components/User/LoginDialog";

export const App: React.FunctionComponent<{}> = props => {
    return (
        <React.StrictMode>
            <div className="App">
                <ThemeProvider theme={theme}>
                    <BrowseView />
                </ThemeProvider>
            </div>
            <LoginDialog />
        </React.StrictMode>
    );
};

export default App;
