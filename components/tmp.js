import React, {useEffect, useState} from "react";
import TrackPlayer, {useProgress} from "react-native-track-player";
import axios from "axios";
import {Modal} from "@ant-design/react-native";
import {
    Animated,
    Easing,
    FlatList,
    Image,
    ImageBackground,
    Text,
    ToastAndroid,
    TouchableHighlight,
    View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import {Button} from "@rneui/base";

const Listener = () => {
    const [songsData, setSongsData] = useState([]);
    const [loadSongsStatus, setLoadSongsStatus] = useState(false);
    const [playStatus, setPlayStatus] = useState(false);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [imgRotateValue, setImgRotateValue] = useState(new Animated.Value(0));
    const [imgRotateStatus, setImgRotateStatus] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const {position, buffered, duration} = useProgress();
    const imgRotateDeg = imgRotateValue.interpolate({
        inputRange: [0, 1], outputRange: ["0deg", "360deg"],
    });

    // 获取数据并且初始化播放器
    useEffect(() => {
        const initTrackPlayer = async tracks => {
            await TrackPlayer.updateOptions({
                stopWithApp: true,
            });
            await TrackPlayer.setupPlayer();
            await TrackPlayer.add(tracks);
        };
        const fetchSongsData = async () => {
            const response = await axios("http://cloud-music.pl-fe.cn/personalized/newsong?limit=200");
            let songsData = await response.data.result.map(element => {
                return {
                    url: "https://music.163.com/song/media/outer/url?id=" + element.song.id + ".mp3",
                    title: element.name,
                    artist: element.song.artists[0].name,
                    artwork: element.picUrl,
                    id: element.id,
                    duration: element.song.duration / 1000,
                };
            });
            setSongsData(songsData);
            await initTrackPlayer(songsData);
        };
        fetchSongsData().then(() => setLoadSongsStatus(true));
    }, []);

    // 播放状态改变时触发：播放时图片旋转，提示信息
    useEffect(() => {
        const imgRotateAni = Animated.loop(Animated.timing(imgRotateValue, {
            toValue: 1, duration: 15000, easing: Easing.linear, useNativeDriver: true,
        }));
        const update = () => {
            if (playStatus) {
                if (buffered < duration)
                    ToastAndroid.show("正在拼命缓冲...", 3000);
                if (!imgRotateStatus) setImgRotateStatus(true);
                imgRotateAni.start();
            } else {
                setImgRotateStatus(false);
                imgRotateAni.stop();
            }
        };
        update();
    }, [playStatus, imgRotateStatus]);

    // 渲染歌曲列表
    const renderItem = ({item, index}) => {
        return (<TouchableHighlight
            onLongPress={() => {
                console.log('longpressed');
                setModalVisible(true);
            }}
            onPress={async () => {
                setCurrentSongIndex(index);
                setPlayStatus(true);
                await TrackPlayer.skip(index);
                await TrackPlayer.play();
            }}>
            <View style={{backgroundColor: "lightgrey"}}>
                <ImageBackground source={{uri: loadSongsStatus ? item.artwork : null}} resizeMode="cover"
                                 style={{
                                     width: "100%",
                                     height: 75,
                                     opacity: 0.2,
                                     position: "absolute",
                                     top: 0,
                                     left: 0,
                                     zIndex: 0,
                                 }}/>
                <Image
                    source={{
                        uri: loadSongsStatus ? item.artwork : null,
                    }}
                    style={{
                        borderRadius: 10, height: 55, width: 55, margin: 10,
                    }}
                />
                <View
                    style={{
                        position: "absolute",
                        left: 85,
                        height: "100%",
                        flexDirection: "column",
                        justifyContent: "space-evenly",
                        zIndex: 10,
                    }}>
                    <View>
                        <Text style={{color: "black"}}>{item.title}</Text>
                    </View>
                    <View>
                        <Text>{item.artist + "   " + formatSeconds(Math.floor(item.duration))}</Text>
                    </View>
                </View>
            </View>
        </TouchableHighlight>);
    }

    return (<View style={{
        backgroundColor: "grey", flexDirection: "column", flex: 1, position: "relative",
    }}>
        <View style={{flex: 1}}>
            <FlatList
                data={songsData}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </View>

        <Modal
            title="Title"
            transparent
            onClose={setModalVisible(true)}
            maskClosable
            visible={modalVisible}>
            <View style={{paddingVertical: 20}}>
                <Text style={{textAlign: 'center'}}>Content...</Text>
                <Text style={{textAlign: 'center'}}>Content...</Text>
            </View>
            <Button type="primary" onPress={setModalVisible(true)}>
                close modal
            </Button>
        </Modal>

        {/*底部音乐控制栏*/}
        <View
            style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                maxHeight: 95,
                flex: 1,
                flexDirection: "row",
                borderTopLeftRadius: 5,
                borderTopRightRadius: 5,
                paddingTop: 5,
                paddingLeft: 5,
                paddingRight: 5,
                borderTop: "1px solid lightgrey",
                position: "relative",
            }}
        >
            <View
                name="left"
                style={{
                    left: 5, backgroundColor: "#fff", height: 60, position: "absolute",
                }}
            >
                <Animated.Image
                    source={{
                        uri: (loadSongsStatus ? songsData[currentSongIndex].artwork : null),
                    }}
                    style={{
                        borderRadius: 32,
                        position: "absolute",
                        top: 3,
                        left: 2,
                        height: 46,
                        width: 46,
                        transform: [{rotate: imgRotateDeg}],
                    }}
                />
                <View
                    style={{
                        position: "absolute",
                        left: 60,
                        height: "80%",
                        flexDirection: "column",
                        justifyContent: "space-evenly",
                    }}
                >
                    <Text style={{color: "#333"}}>{loadSongsStatus ? songsData[currentSongIndex].title : null}</Text>
                    <Text
                        style={{color: "#777"}}>{loadSongsStatus ? (songsData[currentSongIndex].artist + "   " + formatSeconds(position) + "/" + formatSeconds(duration)) : null}</Text>
                </View>
            </View>

            <View
                name="right"
                style={{
                    position: "absolute",
                    right: 0,
                    top: 15,
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    width: 120,
                }}
            >
                <Icon style={{
                    width: 35,
                    height: 30,
                    borderRadius: 32,
                    borderStyle: "dashed",
                    borderColor: "lightgrey",
                    borderWidth: 1,
                    paddingLeft: 11,
                    paddingTop: 9,
                }}
                      onPress={async () => {
                          if (currentSongIndex !== 0) {
                              await TrackPlayer.skipToPrevious();
                              setCurrentSongIndex(currentSongIndex - 1);
                          } else {
                              await TrackPlayer.skip(songsData.length - 1);
                          }
                      }} name="rewind"/>
                <Icon style={{
                    width: 35,
                    height: 30,
                    borderRadius: 32,
                    borderStyle: "dashed",
                    borderColor: "lightgrey",
                    borderWidth: 1,
                    paddingLeft: 12,
                    paddingTop: 9,
                }}
                      onPress={async () => {
                          if (playStatus) {
                              setPlayStatus(false);
                              await TrackPlayer.pause();
                          } else {
                              setPlayStatus(true);
                              await TrackPlayer.play();
                          }
                      }} name={playStatus ? "pause" : "play"}/>
                <Icon style={{
                    width: 35,
                    height: 30,
                    borderRadius: 32,
                    borderStyle: "dashed",
                    borderColor: "lightgrey",
                    borderWidth: 1,
                    paddingLeft: 13,
                    paddingTop: 9,
                }}
                      onPress={async () => {
                          if (currentSongIndex !== songsData.length - 1) {
                              await TrackPlayer.skipToNext();
                              setCurrentSongIndex(currentSongIndex + 1);
                          } else {
                              await TrackPlayer.skip(0);
                          }
                      }} name="fast-forward"/>
            </View>
        </View>

    </View>);
};

// 格式化时间
function formatSeconds(value) {
    let result = parseInt(value);
    let h = Math.floor(result / 3600) < 10 ? "0" + Math.floor(result / 3600) : Math.floor(result / 3600);
    let m = Math.floor((result / 60 % 60)) < 10 ? Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
    let s = Math.floor((result % 60)) < 10 ? "0" + Math.floor((result % 60)) : Math.floor((result % 60));

    let res = "";
    if (h !== "00") res += `${h}h`;
    if (m !== "00") res += `${m}:`;
    res += `${s}`;
    return res;
}

export default Listener;
