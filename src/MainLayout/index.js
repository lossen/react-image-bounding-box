// @flow

import React, { useRef, useCallback } from "react"
import type { Node } from "react"
import { makeStyles, styled } from "@material-ui/core/styles"
import ImageCanvas from "../ImageCanvas"
import styles from "./styles"
import type { MainLayoutState, Action } from "./types"
import useKey from "use-key-hook"
import classnames from "classnames"
import { useSettings } from "../SettingsProvider"
import SettingsDialog from "../SettingsDialog"
// import Fullscreen from "../Fullscreen"
import { FullScreen, useFullScreenHandle } from "react-full-screen"
import getActiveImage from "../Annotator/reducers/get-active-image"
import useImpliedVideoRegions from "./use-implied-video-regions"
import { useDispatchHotkeyHandlers } from "../ShortcutsManager"
import { withHotKeys } from "react-hotkeys"
import iconDictionary from "./icon-dictionary"
import KeyframeTimeline from "../KeyframeTimeline"
import Workspace from "react-material-workspace-layout/dist/Workspace"
import DebugBox from "../DebugSidebarBox"
import TagsSidebarBox from "../TagsSidebarBox"
import KeyframesSelector from "../KeyframesSelectorSidebarBox"
import TaskDescription from "../TaskDescriptionSidebarBox"
import RegionSelector from "../RegionSelectorSidebarBox"
import ImageSelector from "../ImageSelectorSidebarBox"
import HistorySidebarBox from "../HistorySidebarBox"
import useEventCallback from "use-event-callback"

const emptyArr = []
const useStyles = makeStyles(styles)

const HotkeyDiv = withHotKeys(({ hotKeys, children, divRef, ...props }) => (
  <div {...{ ...hotKeys, ...props }} ref={divRef}>
    {children}
  </div>
))

const FullScreenContainer = styled("div")({
  width: "100%",
  height: "100%",
  "& .fullscreen": {
    width: "100%",
    height: "100%",
  },
})

type Props = {
  state: MainLayoutState,
  RegionEditLabel?: Node,
  dispatch: (Action) => any,
  alwaysShowNextButton?: boolean,
  alwaysShowPrevButton?: boolean,
  readOnly?: boolean,
  hideName?: boolean,
  onRegionClassAdded: () => {},
}

export const MainLayout = ({
  state,
  dispatch,
  alwaysShowNextButton = false,
  alwaysShowPrevButton = false,
  RegionEditLabel,
  onRegionClassAdded,
  readOnly,
  hideName,
}: Props) => {
  const classes = useStyles()
  const settings = useSettings()
  const fullScreenHandle = useFullScreenHandle()

  const memoizedActionFns = useRef({})
  const action = (type: string, ...params: Array<string>) => {
    const fnKey = `${type}(${params.join(",")})`
    if (memoizedActionFns.current[fnKey])
      return memoizedActionFns.current[fnKey]

    const fn = (...args: any) =>
      params.length > 0
        ? dispatch(
            ({
              type,
              ...params.reduce((acc, p, i) => ((acc[p] = args[i]), acc), {}),
            }: any)
          )
        : dispatch({ type, ...args[0] })
    memoizedActionFns.current[fnKey] = fn
    return fn
  }

  const { currentImageIndex, activeImage } = getActiveImage(state)
  let nextImage
  if (currentImageIndex !== null) {
    nextImage = state.images[currentImageIndex + 1]
  }

  useKey(() => dispatch({ type: "CANCEL" }), {
    detectKeys: [27],
  })

  const isAVideoFrame = activeImage && activeImage.frameTime !== undefined
  const innerContainerRef = useRef()
  const hotkeyHandlers = useDispatchHotkeyHandlers({ dispatch })

  let impliedVideoRegions = useImpliedVideoRegions(state)

  const refocusOnMouseEvent = useCallback((e) => {
    if (!innerContainerRef.current) return
    if (innerContainerRef.current.contains(document.activeElement)) return
    if (innerContainerRef.current.contains(e.target)) {
      innerContainerRef.current.focus()
      e.target.focus()
    }
  }, [])

  function handleMouseDown(params) {
    state.customMouseDown && state.customMouseDown()
    dispatch({ type: "MOUSE_DOWN", ...params })
  }

  const canvas = (
    <ImageCanvas
      {...settings}
      showCrosshairs={
        settings.showCrosshairs &&
        !["select", "pan", "zoom"].includes(state.selectedTool)
      }
      key={state.selectedImage}
      readOnly={readOnly}
      hideName={hideName}
      showMask={state.showMask}
      fullImageSegmentationMode={state.fullImageSegmentationMode}
      autoSegmentationOptions={state.autoSegmentationOptions}
      showTags={state.showTags}
      allowedArea={state.allowedArea}
      modifyingAllowedArea={state.selectedTool === "modify-allowed-area"}
      regionClsList={state.regionClsList}
      regionTagList={state.regionTagList}
      regions={
        state.annotationType === "image"
          ? activeImage.regions || []
          : impliedVideoRegions
      }
      realSize={activeImage ? activeImage.realSize : undefined}
      videoPlaying={state.videoPlaying}
      imageSrc={state.annotationType === "image" ? activeImage.src : null}
      videoSrc={state.annotationType === "video" ? state.videoSrc : null}
      pointDistancePrecision={state.pointDistancePrecision}
      createWithPrimary={state.selectedTool.includes("create")}
      dragWithPrimary={state.selectedTool === "pan"}
      zoomWithPrimary={state.selectedTool === "zoom"}
      showPointDistances={state.showPointDistances}
      disableClasses={state.disableClasses}
      disableTags={state.disableTags}
      videoTime={
        state.annotationType === "image"
          ? state.selectedImageFrameTime
          : state.currentVideoTime
      }
      keypointDefinitions={state.keypointDefinitions}
      disableRegionType={state.disableRegionType}
      customCloseRegion={state.customCloseRegion}
      customSelectRegion={state.customSelectRegion}
      newRegions={state.newRegions}
      customOpenRegion={state.customOpenRegion}
      customDeleteRegion={state.customDeleteRegion}
      onLinkResource={state.onLinkResource}
      onMouseMove={action("MOUSE_MOVE")}
      onMouseDown={(param) => handleMouseDown(param) }
      onMouseUp={action("MOUSE_UP")}
      onChangeRegion={action("CHANGE_REGION", "region")}
      onUpdateRegions={action("UPDATE_REGIONS", "regions")}
      onBeginRegionEdit={action("OPEN_REGION_EDITOR", "region")}
      onCloseRegionEdit={action("CLOSE_REGION_EDITOR", "region")}
      onDeleteRegion={action("DELETE_REGION", "region")}
      onBeginBoxTransform={action("BEGIN_BOX_TRANSFORM", "box", "directions")}
      onBeginMovePolygonPoint={action(
        "BEGIN_MOVE_POLYGON_POINT",
        "polygon",
        "pointIndex"
      )}
      onBeginMoveKeypoint={action(
        "BEGIN_MOVE_KEYPOINT",
        "region",
        "keypointId"
      )}
      onAddPolygonPoint={action(
        "ADD_POLYGON_POINT",
        "polygon",
        "point",
        "pointIndex"
      )}
      onSelectRegion={action("SELECT_REGION", "region")}
      onBeginMovePoint={action("BEGIN_MOVE_POINT", "point")}
      onImageLoaded={action("IMAGE_LOADED", "image")}
      RegionEditLabel={RegionEditLabel}
      onImageOrVideoLoaded={action("IMAGE_OR_VIDEO_LOADED", "metadata")}
      onChangeVideoTime={action("CHANGE_VIDEO_TIME", "newTime")}
      onChangeVideoPlaying={action("CHANGE_VIDEO_PLAYING", "isPlaying")}
      onRegionClassAdded={onRegionClassAdded}
    />
  )

  const onClickIconSidebarItem = useEventCallback((item) => {
    if (item.name === "Fullscreen") {
      fullScreenHandle.enter()
      dispatch({ type: "HEADER_BUTTON_CLICKED", buttonName: item.name })
    } else if (item.name === "Window") {
      fullScreenHandle.exit()
      dispatch({ type: "HEADER_BUTTON_CLICKED", buttonName: item.name })
    }else if(item.name === "create-box") {
      if(!readOnly) dispatch({ type: "SELECT_TOOL", selectedTool: item.name })
    }else dispatch({ type: "SELECT_TOOL", selectedTool: item.name })
  })

  const onClickHeaderItem = useEventCallback((item) => {
    if (item.name === "Fullscreen") {
      fullScreenHandle.enter()
    } else if (item.name === "Window") {
      fullScreenHandle.exit()
    }
    dispatch({ type: "HEADER_BUTTON_CLICKED", buttonName: item.name })
  })

  const debugModeOn = Boolean(window.localStorage.$ANNOTATE_DEBUG_MODE && state)
  const nextImageHasRegions =
    !nextImage || (nextImage.regions && nextImage.regions.length > 0)

  return (
    <FullScreenContainer>
      <FullScreen
        handle={fullScreenHandle}
        onChange={(open) => {
          if (!open) {
            fullScreenHandle.exit()
            action("HEADER_BUTTON_CLICKED", "buttonName")("Window")
          }
        }}
      >
        <HotkeyDiv
          tabIndex={-1}
          divRef={innerContainerRef}
          onMouseDown={refocusOnMouseEvent}
          onMouseOver={refocusOnMouseEvent}
          allowChanges
          handlers={hotkeyHandlers}
          className={classnames(
            classes.container,
            state.fullScreen && "Fullscreen",
              "bounding-box-container"
          )}
        >
          <Workspace
            allowFullscreen
            iconDictionary={iconDictionary}
            headerLeftSide={!state.disableTopNav ? [
              state.annotationType === "video" ? (
                <KeyframeTimeline
                  currentTime={state.currentVideoTime}
                  duration={state.videoDuration}
                  onChangeCurrentTime={action("CHANGE_VIDEO_TIME", "newTime")}
                  keyframes={state.keyframes}
                />
              ) : activeImage ? (
                <div className={classes.headerTitle}>{activeImage.name}</div>
              ) : null,
            ].filter(Boolean) : []}
            headerItems={!state.disableTopNav ? [
              !state.disableNavs && { name: "Prev" },
              !state.disableNavs && { name: "Next" },
              state.annotationType !== "video"
                ? null
                : !state.videoPlaying
                ? { name: "Play" }
                : { name: "Pause" },
              !nextImageHasRegions && activeImage.regions && { name: "Clone" },
              !state.disableSettings && { name: "Settings" },
              state.fullScreen ? { name: "Window" } : { name: "Fullscreen" },
              { name: "Save" },
            ].filter(Boolean) : []}
            onClickHeaderItem={onClickHeaderItem}
            onClickIconSidebarItem={onClickIconSidebarItem}
            selectedTools={[
              state.selectedTool,
              state.showTags && "show-tags",
              state.showMask && "show-mask",
            ].filter(Boolean)}
            iconSidebarItems={[
              {
                name: "select",
                helperText: "Select",
                alwaysShowing: true,
              },
              {
                name: "pan",
                helperText: "Drag/Pan",
                alwaysShowing: true,
              },
              {
                name: "zoom",
                helperText: "Zoom In/Out",
                alwaysShowing: false,
              },
              {
                name: "show-tags",
                helperText: "Show / Hide Tags",
                alwaysShowing: false,
              },
              {
                name: "create-point",
                helperText: "Add Point",
                alwaysShowing: false,
              },
              {
                name: "create-box",
                helperText: "Add Bounding Box",
              },
              {
                name: "create-polygon",
                helperText: "Add Polygon",
                alwaysShowing: false,
              },
              {
                name: "create-expanding-line",
                helperText: "Add Expanding Line",
              },
              {
                name: "create-keypoints",
                helperText: "Add Keypoints (Pose)",
              },
              state.fullImageSegmentationMode && {
                name: "show-mask",
                alwaysShowing: false,
                helperText: "Show / Hide Mask",
              },
              {
                name: "modify-allowed-area",
                helperText: "Modify Allowed Area",
              },
              { name: state.fullScreen ? "Window" : "Fullscreen",
                alwaysShowing: true,
                helperText: state.fullScreen ? "Window" : "Fullscreen",
              }
            ]
              .filter(Boolean)
              .filter(
                (a) => a.alwaysShowing || state.enabledTools.includes(a.name)
              )}
            rightSidebarItems={state.disableRightSidebar ? [] : [
              debugModeOn && (
                <DebugBox state={debugModeOn} lastAction={state.lastAction} />
              ),
              state.taskDescription && (
                <TaskDescription description={state.taskDescription} />
              ),
              state.labelImages && (
                <TagsSidebarBox
                  currentImage={activeImage}
                  imageClsList={state.imageClsList}
                  imageTagList={state.imageTagList}
                  onChangeImage={action("CHANGE_IMAGE", "delta")}
                  expandedByDefault
                />
              ),
              // (state.images?.length || 0) > 1 && (
              //   <ImageSelector
              //     onSelect={action("SELECT_REGION", "region")}
              //     images={state.images}
              //   />
              // ),
              <RegionSelector
                regions={activeImage ? activeImage.regions : emptyArr}
                onSelectRegion={action("SELECT_REGION", "region")}
                customSelectRegion={state.customSelectRegion}
                onDeleteRegion={action("DELETE_REGION", "region")}
                onChangeRegion={action("CHANGE_REGION", "region")}
              />,
              state.keyframes && (
                <KeyframesSelector
                  onChangeVideoTime={action("CHANGE_VIDEO_TIME", "newTime")}
                  onDeleteKeyframe={action("DELETE_KEYFRAME", "time")}
                  onChangeCurrentTime={action("CHANGE_VIDEO_TIME", "newTime")}
                  currentTime={state.currentVideoTime}
                  duration={state.videoDuration}
                  keyframes={state.keyframes}
                />
              ),
              <HistorySidebarBox
                history={state.history}
                onRestoreHistory={action("RESTORE_HISTORY")}
              />,
            ].filter(Boolean)}
          >
            {canvas}
          </Workspace>
          {/*<SettingsDialog*/}
          {/*  open={state.settingsOpen}*/}
          {/*  onClose={() =>*/}
          {/*    dispatch({*/}
          {/*      type: "HEADER_BUTTON_CLICKED",*/}
          {/*      buttonName: "Settings",*/}
          {/*    })*/}
          {/*  }*/}
          {/*/>*/}
        </HotkeyDiv>
      </FullScreen>
    </FullScreenContainer>
  )
}

export default MainLayout
