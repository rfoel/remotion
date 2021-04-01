import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {CompositionManager} from '../CompositionManager';
import {FEATURE_FLAG_V2_BREAKING_CHANGES} from '../feature-flags';
import {getTimelineClipName} from '../get-timeline-clip-name';
import {TimelineContext} from '../timeline-position-state';
import {useAbsoluteCurrentFrame} from '../use-frame';
import {useUnsafeVideoConfig} from '../use-unsafe-video-config';

type SequenceContextType = {
	absoluteFrom: number;
	relativeFrom: number;
	durationInFrames: number;
	id: string;
};

export const SequenceContext = createContext<SequenceContextType | null>(null);

export const Sequence: React.FC<{
	children: React.ReactNode;
	from: number;
	durationInFrames: number;
	name?: string;
	layout?: 'absolute-fill' | 'none';
}> = ({from, durationInFrames, children, name, layout = 'absolute-fill'}) => {
	const [id] = useState(() => String(Math.random()));
	const parentSequence = useContext(SequenceContext);
	const {isThumbnail, rootId} = useContext(TimelineContext);
	const actualFrom = (parentSequence?.absoluteFrom ?? 0) + from;

	if (layout !== 'absolute-fill' && layout !== 'none') {
		throw new TypeError(
			`The layout prop of <Sequence /> expects either "absolute-fill" or "none", but you passed: ${layout}`
		);
	}

	if (typeof durationInFrames !== 'number') {
		throw new TypeError(
			`You passed to durationInFrames an argument of type ${typeof durationInFrames}, but it must be a number.`
		);
	}
	if (durationInFrames <= 0) {
		throw new TypeError(
			`durationInFrames must be positive, but got ${durationInFrames}`
		);
	}
	if (typeof from !== 'number') {
		throw new TypeError(
			`You passed to the "from" props of your <Sequence> an argument of type ${typeof from}, but it must be a number.`
		);
	}

	const absoluteFrame = useAbsoluteCurrentFrame();
	const unsafeVideoConfig = useUnsafeVideoConfig();
	const compositionDuration = unsafeVideoConfig
		? unsafeVideoConfig.durationInFrames
		: 0;
	const actualDurationInFrames = Math.min(
		compositionDuration - from,
		parentSequence
			? Math.min(
					parentSequence.durationInFrames +
						parentSequence.absoluteFrom -
						actualFrom,
					durationInFrames
			  )
			: durationInFrames
	);
	const {registerSequence, unregisterSequence} = useContext(CompositionManager);

	const contextValue = useMemo((): SequenceContextType => {
		return {
			absoluteFrom: actualFrom,
			relativeFrom: from,
			durationInFrames: actualDurationInFrames,
			id,
		};
	}, [actualDurationInFrames, actualFrom, from, id]);

	const timelineClipName = useMemo(() => {
		return name ?? getTimelineClipName(children);
	}, [children, name]);

	useEffect(() => {
		registerSequence({
			from,
			duration: actualDurationInFrames,
			id,
			displayName: timelineClipName,
			parent: parentSequence?.id ?? null,
			type: 'sequence',
			isThumbnail,
			rootId,
		});
		return () => {
			unregisterSequence(id);
		};
	}, [
		durationInFrames,
		actualFrom,
		id,
		name,
		registerSequence,
		timelineClipName,
		unregisterSequence,
		parentSequence?.id,
		isThumbnail,
		actualDurationInFrames,
		rootId,
		from,
	]);

	const endThreshold = (() => {
		if (FEATURE_FLAG_V2_BREAKING_CHANGES) {
			return actualFrom + durationInFrames - 1;
		}
		return actualFrom + durationInFrames;
	})();

	const content =
		absoluteFrame < actualFrom
			? null
			: absoluteFrame > endThreshold
			? null
			: children;

	return (
		<SequenceContext.Provider value={contextValue}>
			{layout === 'absolute-fill' ? (
				<div
					style={{
						position: 'absolute',
						display: 'flex',
						width: '100%',
						height: '100%',
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
					}}
				>
					{content}
				</div>
			) : (
				content
			)}
		</SequenceContext.Provider>
	);
};
