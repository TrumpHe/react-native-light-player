import React from "react";
import {Tabs} from "@ant-design/react-native";
import Recorder from "./components/Recorder";
import Listener from "./components/Listener";

const App = () => {
    const style = {
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "#fff",
    };
    const tabs = [{title: "随声听"}, {title: "录音室"}];
    return (
        <Tabs tabs={tabs}>
            <Listener/>
            <Recorder/>
        </Tabs>
    );
};

export default App;
